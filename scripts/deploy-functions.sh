#!/bin/bash

# ==============================================================================
# Cloud Functions Deployment Script
#
# Deploy Firebase Cloud Functions with build, deploy specific,
# deploy all, and rollback capabilities.
#
# @module scripts/deploy-functions
# ==============================================================================

# Set strict mode
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${FIREBASE_PROJECT:-atty-financial-production}"
REGION="${CLOUD_REGION:-us-central1}"
STAGING_PROJECT_ID="atty-financial-staging"
FUNCTIONS_DIR="functions"
STAGE="production"  # Can be overridden with --stage flag

# Parse command line arguments
COMMAND=${1:-help}
FUNCTION_NAME=${2:-}
ENV=${3:-production}

# Help message
function show_help() {
  echo -e "${BLUE}Cloud Functions Deployment Script${NC}"
  echo ""
  echo "Usage:"
  echo "  $0 <command> [options]"
  echo ""
  echo "Commands:"
  echo "  ${GREEN}build${NC}                Build Cloud Functions"
  echo "  ${GREEN}deploy${NC}              Deploy all functions to production"
  echo "  ${GREEN}deploy-specific${NC}    Deploy specific function"
  echo "  ${GREEN}deploy-staging${NC}     Deploy all functions to staging"
  echo "  ${GREEN}rollback${NC}            Rollback to previous deployment"
  echo "  ${GREEN}list${NC}                List all deployed functions"
  echo "  ${GREEN}logs${NC}                View function logs"
  echo "  ${GREEN}status${NC}              Check deployment status"
  echo "  ${GREEN}clean${NC}               Clean build artifacts"
  echo "  ${YELLOW}help${NC}                 Show this help message"
  echo ""
  echo "Options:"
  echo "  ${GREEN}--stage${NC} <staging|production>  Target environment (default: production)"
  echo "  ${GREEN}--region${NC} <region>                   Target region (default: us-central1)"
  echo "  ${GREEN}--project${NC} <project-id>               Firebase project ID"
  echo "  ${GREEN}--function${NC} <function-name>            Specific function to deploy"
  echo "  ${GREEN}--force${NC}                             Force deployment without confirmation"
  echo "  ${GREEN}--verbose${NC}                           Enable verbose output"
  echo ""
  echo "Examples:"
  echo "  $0 build"
  echo "  $0 deploy"
  echo "  $0 deploy --stage staging"
  echo "  $0 deploy-specific apiGetMatters"
  echo "  $0 rollback"
  echo "  $0 list"
  echo "  $0 logs apiGetMatters"
  echo "  $0 status"
}

# Build functions
function build_functions() {
  echo -e "${BLUE}Building Cloud Functions...${NC}"
  cd "$FUNCTIONS_DIR"

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
  fi

  # Build TypeScript
  echo -e "${BLUE}Compiling TypeScript...${NC}"
  npm run build

  # Check if build succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful!${NC}"
  else
    echo -e "${RED}Build failed!${NC}"
    exit 1
  fi
}

# Deploy all functions
function deploy_all() {
  echo -e "${BLUE}Deploying Cloud Functions to ${STAGE}...${NC}"
  
  # Deploy to appropriate project
  PROJECT="$PROJECT_ID"
  if [ "$STAGE" = "staging" ]; then
    PROJECT="$STAGING_PROJECT_ID"
  fi

  # Use Firebase CLI to deploy
  echo -e "${BLUE}Target project: $PROJECT${NC}"
  echo -e "${BLUE}Target region: $REGION${NC}"
  
  firebase deploy --only functions --project "$PROJECT" --region "$REGION"
  
  # Check if deployment succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    
    # Log deployment
    log_deployment "all" "$STAGE"
  else
    echo -e "${RED}Deployment failed!${NC}"
    log_deployment "all" "$STAGE" "failed"
    exit 1
  fi
}

# Deploy specific function
function deploy_specific() {
  FUNCTION_NAME="$1"
  
  if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}Error: Function name required${NC}"
    echo "Usage: $0 deploy-specific <function-name>"
    exit 1
  fi

  echo -e "${BLUE}Deploying specific function: $FUNCTION_NAME${NC} to $STAGE"
  
  # Deploy to appropriate project
  PROJECT="$PROJECT_ID"
  if [ "$STAGE" = "staging" ]; then
    PROJECT="$STAGING_PROJECT_ID"
  fi

  # Build before deploying
  build_functions

  # Deploy specific function
  firebase deploy --only functions:"$FUNCTION_NAME" --project "$PROJECT" --region "$REGION"
  
  # Check if deployment succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    log_deployment "$FUNCTION_NAME" "$STAGE"
  else
    echo -e "${RED}Deployment failed!${NC}"
    log_deployment "$FUNCTION_NAME" "$STAGE" "failed"
    exit 1
  fi
}

# Deploy to staging
function deploy_staging() {
  echo -e "${BLUE}Deploying Cloud Functions to staging...${NC}"
  
  # Build before deploying
  build_functions

  # Deploy to staging project
  firebase deploy --only functions --project "$STAGING_PROJECT_ID" --region "$REGION"
  
  # Check if deployment succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment to staging successful!${NC}"
    log_deployment "all" "staging"
  else
    echo -e "${RED}Deployment to staging failed!${NC}"
    log_deployment "all" "staging" "failed"
    exit 1
  fi
}

# Rollback to previous deployment
function rollback() {
  echo -e "${YELLOW}Rolling back to previous deployment...${NC}"
  
  # Get previous deployment ID
  PREVIOUS_VERSION=$(firebase deploy:list --only functions --json 2>/dev/null | \
    grep -o '"version": "[^"]*"' | \
    tail -n 2 | \
    cut -d'"' -f4)
  
  if [ -z "$PREVIOUS_VERSION" ]; then
    echo -e "${RED}No previous deployment found${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Rolling back to version: $PREVIOUS_VERSION${NC}"
  
  # Deploy previous version
  firebase deploy --only functions --project "$PROJECT_ID" --region "$REGION" --version "$PREVIOUS_VERSION"
  
  # Check if rollback succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Rollback successful!${NC}"
    log_deployment "rollback" "production" "success" "$PREVIOUS_VERSION"
  else
    echo -e "${RED}Rollback failed!${NC}"
    log_deployment "rollback" "production" "failed" "$PREVIOUS_VERSION"
    exit 1
  fi
}

# List deployed functions
function list_functions() {
  echo -e "${BLUE}Listing deployed functions...${NC}"
  
  # List deployed functions
  firebase functions:list
  
  # Check if list succeeded
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Function list retrieved!${NC}"
  else
    echo -e "${RED}Failed to retrieve function list${NC}"
    exit 1
  fi
}

# View function logs
function view_logs() {
  FUNCTION_NAME="$1"
  
  if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}Error: Function name required${NC}"
    echo "Usage: $0 logs <function-name>"
    exit 1
  fi

  echo -e "${BLUE}Viewing logs for function: $FUNCTION_NAME${NC}"
  
  # View function logs
  firebase functions:log "$FUNCTION_NAME" --project "$PROJECT_ID"
  
  # Check if logs retrieved successfully
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Logs retrieved!${NC}"
  else
    echo -e "${RED}Failed to retrieve logs${NC}"
    exit 1
  fi
}

# Check deployment status
function check_status() {
  echo -e "${BLUE}Checking deployment status...${NC}"
  
  # Get deployment list
  firebase deploy:list --only functions --json | jq '.functions[] | .[] | .{name: .name, region: .region, runtime: .runtime, status: .status}'
}

# Clean build artifacts
function clean_build() {
  echo -e "${BLUE}Cleaning build artifacts...${NC}"
  cd "$FUNCTIONS_DIR"

  # Remove lib directory (build output)
  if [ -d "lib" ]; then
    rm -rf lib
    echo -e "${GREEN}Build artifacts cleaned!${NC}"
  else
    echo -e "${YELLOW}No build artifacts to clean${NC}"
  fi

  # Remove node_modules (optional, with --deep flag)
  if [[ "$*" == *"--deep"* ]]; then
    if [ -d "node_modules" ]; then
      rm -rf node_modules
      echo -e "${GREEN}node_modules cleaned!${NC}"
    fi
  fi
}

# Log deployment to Firestore
function log_deployment() {
  FUNCTIONS="$1"
  ENVIRONMENT="$2"
  STATUS="${3:-success}"
  VERSION="$4"

  # Get current timestamp
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Create deployment record
  firebase firestore: deployments --project "$PROJECT_ID" --data "{
    functions: \"$FUNCTIONS\",
    environment: \"$ENVIRONMENT\",
    status: \"$STATUS\",
    timestamp: \"$TIMESTAMP\",
    version: \"$VERSION\",
    region: \"$REGION\",
    deployedBy: \"$(git config user.name) <$(git config user.email)>\",
    commit: \"$(git rev-parse HEAD)\"
  }"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment logged successfully${NC}"
  else
    echo -e "${YELLOW}Failed to log deployment${NC}"
  fi
}

# Main script logic
function main() {
  case "$COMMAND" in
    build)
      build_functions
      ;;
    deploy)
      deploy_all
      ;;
    deploy-specific)
      deploy_specific "$FUNCTION_NAME"
      ;;
    deploy-staging)
      deploy_staging
      ;;
    rollback)
      rollback
      ;;
    list)
      list_functions
      ;;
    logs)
      view_logs "$FUNCTION_NAME"
      ;;
    status)
      check_status
      ;;
    clean)
      clean_build
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo -e "${RED}Unknown command: $COMMAND${NC}"
      show_help
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
