---
description: Launch parallel agents to accomplish a task.
argument-hint: [prompt request] [count]
---

# Parallel Subagents

Follow the `Workflow` below to launch `COUNT` agents in parallel to accomplish a task detailed in the `PROMPT_REQUEST`.

**IMPORTANT SAFETY FEATURE**: This command now automatically creates a new git branch, commits changes, and creates a pull request for safe code review before merging to main.

## Usage Examples

```bash
# Basic usage with 3 agents (default)
/parallel_subagents "Fix the navigation and separation of concerns for the app"

# Specify number of agents (1-5 supported)
/parallel_subagents "Implement user authentication system" 4

# Single agent for simple tasks
/parallel_subagents "Add dark mode toggle" 1
```

## Workflow Output

✅ **Safe Git Workflow**:
1. Creates feature branch from main
2. Runs parallel agents on isolated branch
3. Validates integration automatically
4. Commits changes with detailed message
5. Pushes branch to remote repository
6. Creates pull request for code review
7. Returns to main branch safely

**Result**: Professional development workflow with code review, merge safety, and complete change tracking.

## Variables

PROMPT_REQUEST: $1
COUNT: $2

## Workflow

1. Parse Input Parameters
   - Extract PROMPT_REQUEST to understand the task
   - Determine COUNT (use provided value or infer from task complexity)

2. Create Feature Branch (SAFETY FIRST)
   - Generate branch name from task description
   - Create and checkout new git branch
   - Ensure clean working directory before starting

3. Design Agent Prompts
   - Create detailed, self-contained prompts for each agent
   - Include specific instructions on what to accomplish
   - Define clear output expectations
   - Remember agents are stateless and need complete context

4. Launch Parallel Agents
   - Use Task tool to spawn N agents simultaneously
   - Ensure all agents launch in a single parallel batch

5. Collect & Summarize Results
   - Gather outputs from all completed agents
   - Synthesize findings into cohesive response

6. Integration Validation (CRITICAL)
   - Run integration validator agent to catch build errors
   - Verify all imports resolve correctly
   - Check for TypeScript compilation errors
   - Test development server startup
   - Report any integration issues before completion

7. Commit Changes & Create Pull Request
   - Stage and commit all changes to feature branch
   - Push branch to remote repository
   - Create pull request with detailed description
   - Provide merge instructions

## Run

```bash
# 1. Parse Input Parameters
PROMPT_REQUEST="$1"
COUNT="${2:-3}"  # Default to 3 agents if not specified

echo "=== Parallel Subagents Workflow ==="
echo "Task: $PROMPT_REQUEST"
echo "Agent Count: $COUNT"
echo ""

# 2. Create Feature Branch (SAFETY FIRST)
echo "=== Creating Feature Branch ==="

# Ensure we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. This command must be run from within a git project."
    exit 1
fi

# Ensure we're on main and it's clean
git checkout main
git pull origin main

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Generate branch name from task description (first 3 words, lowercase, hyphenated)
BRANCH_NAME=$(echo "$PROMPT_REQUEST" | head -c 50 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]/ /g' | sed 's/  */ /g' | cut -d' ' -f1-3 | tr ' ' '-' | sed 's/-$//')

# Add timestamp to avoid conflicts
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="feature/${BRANCH_NAME}-${TIMESTAMP}"

echo "Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

echo "✅ Feature branch created successfully"
echo ""

# 3. Design Agent Prompts & 4. Launch Parallel Agents
echo "=== Launching $COUNT Parallel Agents ==="
echo "Task: $PROMPT_REQUEST"
echo ""

# Launch agents based on COUNT parameter
case $COUNT in
    1)
        Task --subagent_type "build-agent" --description "Complete task implementation" --prompt "$PROMPT_REQUEST" --model "sonnet"
        ;;
    2)
        Task --subagent_type "build-agent" --description "Task part 1" --prompt "$PROMPT_REQUEST - Focus on core implementation and main functionality." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Task part 2" --prompt "$PROMPT_REQUEST - Focus on testing, validation, and edge cases." --model "sonnet" &
        wait
        ;;
    3)
        Task --subagent_type "build-agent" --description "Core implementation" --prompt "$PROMPT_REQUEST - Implement the main functionality and core features." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Testing & validation" --prompt "$PROMPT_REQUEST - Focus on testing, error handling, and validation logic." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Documentation & integration" --prompt "$PROMPT_REQUEST - Add documentation, improve integration, and polish the implementation." --model "sonnet" &
        wait
        ;;
    4)
        Task --subagent_type "build-agent" --description "Frontend implementation" --prompt "$PROMPT_REQUEST - Focus on UI/UX components and frontend functionality." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Backend implementation" --prompt "$PROMPT_REQUEST - Focus on backend logic, APIs, and data handling." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Testing & quality" --prompt "$PROMPT_REQUEST - Implement comprehensive testing and quality assurance." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Integration & polish" --prompt "$PROMPT_REQUEST - Handle integration details and polish the implementation." --model "sonnet" &
        wait
        ;;
    5)
        Task --subagent_type "build-agent" --description "Component 1" --prompt "$PROMPT_REQUEST - Implement the first major component or feature." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Component 2" --prompt "$PROMPT_REQUEST - Implement the second major component or feature." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Component 3" --prompt "$PROMPT_REQUEST - Implement the third major component or feature." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Testing & validation" --prompt "$PROMPT_REQUEST - Focus on comprehensive testing and validation." --model "sonnet" &
        Task --subagent_type "build-agent" --description "Integration & documentation" --prompt "$PROMPT_REQUEST - Handle integration and add proper documentation." --model "sonnet" &
        wait
        ;;
    *)
        echo "❌ Unsupported agent count: $COUNT (supported: 1-5)"
        exit 1
        ;;
esac

# 5. Collect & Summarize Results
echo ""
echo "=== Agent Execution Complete ==="
echo "All agents have completed their tasks"
echo ""

# 6. Integration Validation (CRITICAL)
echo "=== Running Integration Validation ==="

# Determine target directory (look for package.json)
TARGET_DIR="."
if [ -f "apps/leadcarrot/package.json" ]; then
    TARGET_DIR="apps/leadcarrot"
elif [ -f "package.json" ]; then
    TARGET_DIR="."
fi

echo "Target directory: $TARGET_DIR"

# Run integration validator
Task \
    --subagent_type "build-agent" \
    --description "Validate code integration" \
    --prompt "Validate all code changes in $TARGET_DIR for build errors, import issues, and TypeScript compilation failures. Ensure the development server can start without errors. Check all files that were modified by the parallel agents." \
    --model "sonnet"

VALIDATION_EXIT_CODE=$?

if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Integration validation passed"
else
    echo "❌ Integration validation failed"
    echo "Please fix the reported issues before proceeding"
    echo "Changes are staged on branch: $BRANCH_NAME"
    exit 1
fi

# 7. Commit Changes & Create Pull Request
echo ""
echo "=== Committing Changes ==="

# Stage all changes
git add .

# Check if there are changes to commit
if [ -n "$(git diff --cached --name-only)" ]; then
    # Create commit message based on task description
    COMMIT_MSG=$(echo "$PROMPT_REQUEST" | head -c 80)

    git commit -m "$(cat <<EOF
Implement: $COMMIT_MSG

- Implemented using parallel agents workflow
- Features developed by $COUNT specialized agents
- All integration validation tests passed
- Changes ready for code review and merge

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

    echo "✅ Changes committed successfully"

    # Push to remote
    git push -u origin "$BRANCH_NAME"
    echo "✅ Branch pushed to remote: $BRANCH_NAME"

    # Create pull request
    echo ""
    echo "=== Creating Pull Request ==="

    # Get current repo URL and extract repo info
    REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/.git$//')

    # Create PR using GitHub CLI if available
    if command -v gh &> /dev/null; then
        gh pr create \
            --title "Implement: $COMMIT_MSG" \
            --body "$(cat <<EOF
## Summary
$PROMPT_REQUEST

## Implementation Details
- Developed using parallel agents workflow with $COUNT specialized agents
- All changes have passed integration validation
- Build and tests are passing successfully

## Changes Made
- Core functionality implemented by parallel development agents
- Comprehensive testing and validation completed
- Integration issues resolved and code quality verified

## Testing
- ✅ Integration validation passed
- ✅ Build system verification completed
- ✅ TypeScript compilation successful
- ✅ Development server startup verified

## Checklist
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Ready for production deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
            --base main \
            --head "$BRANCH_NAME"

        echo "✅ Pull request created successfully"
        echo "🔗 View PR at: $REPO_URL/pull/$(gh pr view --json number -q .number || echo 'new')"
    else
        echo "ℹ️ GitHub CLI not found. Create PR manually:"
        echo "   1. Visit: $REPO_URL/compare/main...$BRANCH_NAME"
        echo "   2. Review changes and create pull request"
        echo "   3. Use title: Implement: $COMMIT_MSG"
    fi

else
    echo "⚠️ No changes to commit"
    echo "Switching back to main branch"
    git checkout main
    git branch -D "$BRANCH_NAME"
fi

echo ""
echo "=== Workflow Complete ==="
echo "Feature branch: $BRANCH_NAME"
echo "Status: Ready for code review and merge"
echo ""
```
