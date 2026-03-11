---
description: Prime a specific app folder for comprehensive understanding and analysis
argument-hint: <app_name>
---

# Prime App

Dynamically analyze and understand the specified app folder structure, dependencies, and purpose.

## Variables

APP_NAME: $ARGUMENTS
REFRESH_MODE: false

## Usage
`/prime_app <app_name>` or `/prime_app --refresh <app_name>`

Example: `/prime_app orchestrator_db` or `/prime_app --refresh orchestrator_3_stream`

## Refresh Mode Handling

```bash
# Check for --refresh flag
if [[ "$ARGUMENTS" == *"--refresh"* ]]; then
    REFRESH_MODE=true
    APP_NAME=$(echo "$ARGUMENTS" | sed 's/--refresh//' | xargs)
else
    APP_NAME="$ARGUMENTS"
fi
```

## Validation

First, check if we have a saved analysis and then verify the app exists:

```bash
# Check if app directory exists
if [ ! -d "apps/$APP_NAME" ]; then
    echo "Error: App '$APP_NAME' not found in apps/ directory"
    echo "Available apps:"
    ls -1 apps/
    exit 1
fi

# Check for saved analysis file first (unless in refresh mode)
ANALYSIS_FILE="apps/$APP_NAME/APP_ANALYSIS.md"
if [ "$REFRESH_MODE" != "true" ] && [ -f "$ANALYSIS_FILE" ]; then
    echo "=== Saved Analysis Found ==="
    echo "Using cached analysis from: $ANALYSIS_FILE"
    echo "Last analysis saved on: $(stat -c %y "$ANALYSIS_FILE" 2>/dev/null || stat -f %Sm "$ANALYSIS_FILE" 2>/dev/null)"
    echo ""
    echo "=== Current App Status ==="
    echo "App: $APP_NAME"
    echo "Path: apps/$APP_NAME"
    echo "Size: $(du -sh apps/$APP_NAME 2>/dev/null | cut -f1)"
    echo "Files: $(find apps/$APP_NAME -type f 2>/dev/null | wc -l)"
    echo "Last modified: $(stat -c %y apps/$APP_NAME 2>/dev/null || stat -f %Sm apps/$APP_NAME 2>/dev/null)"
    echo ""
    echo "=== Recent Changes ==="
    cd apps/$APP_NAME
    if [ -d .git ]; then
        echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
        echo "Recent commits (last 3):"
        git log --oneline -3 2>/dev/null || echo "No git history available"
    else
        echo "Git repository: No"
    fi
    cd ../..
    echo ""
    echo "To refresh the full analysis, run: /prime_app --refresh $APP_NAME"
    echo ""
    exit 0
elif [ "$REFRESH_MODE" = "true" ] && [ -f "$ANALYSIS_FILE" ]; then
    echo "=== Refresh Mode ==="
    echo "Refreshing cached analysis from: $ANALYSIS_FILE"
    echo "Previous analysis saved on: $(stat -c %y "$ANALYSIS_FILE" 2>/dev/null || stat -f %Sm "$ANALYSIS_FILE" 2>/dev/null)"
    echo ""
fi

# Get app info (no cached analysis found)
echo "=== App Information ==="
echo "App: $APP_NAME"
echo "Path: apps/$APP_NAME"
echo "Size: $(du -sh apps/$APP_NAME 2>/dev/null | cut -f1)"
echo "Files: $(find apps/$APP_NAME -type f 2>/dev/null | wc -l)"
echo "Last modified: $(stat -c %y apps/$APP_NAME 2>/dev/null || stat -f %Sm apps/$APP_NAME 2>/dev/null)"
echo ""
```

## Run

Execute discovery commands to understand the app structure and technology stack:

```bash
echo "=== Git Information ==="
cd apps/$APP_NAME
if [ -d .git ]; then
    echo "Git repository: Yes"
    echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
    echo "Last commit: $(git log -1 --format='%h %s' 2>/dev/null || echo 'N/A')"
    echo "Remote: $(git remote get-url origin 2>/dev/null || echo 'N/A')"
else
    echo "Git repository: No"
fi
cd ../..

echo ""
echo "=== Technology Stack Detection ==="

# Detect programming languages
cd apps/$APP_NAME
echo "Primary languages:"
find . -type f -name "*.py" | head -5 | while read file; do echo "  Python: $(basename $file)"; done
find . -type f -name "*.js" | head -5 | while read file; do echo "  JavaScript: $(basename $file)"; done
find . -type f -name "*.ts" | head -5 | while read file; do echo "  TypeScript: $(basename $file)"; done
find . -type f -name "*.vue" | head -5 | while read file; do echo "  Vue: $(basename $file)"; done
find . -type f -name "*.jsx" -o -name "*.tsx" | head -5 | while read file; do echo "  React: $(basename $file)"; done
find . -type f -name "*.go" | head -5 | while read file; do echo "  Go: $(basename $file)"; done
find . -type f -name "*.rs" | head -5 | while read file; do echo "  Rust: $(basename $file)"; done

echo ""
echo "Package managers:"
[ -f "package.json" ] && echo "  npm/yarn: package.json found"
[ -f "requirements.txt" ] && echo "  pip: requirements.txt found"
[ -f "pyproject.toml" ] && echo "  poetry/pip: pyproject.toml found"
[ -f "Cargo.toml" ] && echo "  cargo: Cargo.toml found"
[ -f "go.mod" ] && echo "  go modules: go.mod found"
[ -f "composer.json" ] && echo "  composer: composer.json found"

echo ""
echo "Configuration files:"
[ -f ".env.example" ] && echo "  Environment: .env.example"
[ -f ".env" ] && echo "  Environment: .env (WARNING: secrets may be present)"
[ -f "docker-compose.yml" ] && echo "  Docker: docker-compose.yml"
[ -f "Dockerfile" ] && echo "  Docker: Dockerfile"
[ -f "Makefile" ] && echo "  Build: Makefile"
[ -f "justfile" ] && echo "  Build: justfile"

cd ../..
```

## Read

Dynamically discover and read key files based on the app structure:

```bash
echo "=== Key Files Discovery ==="
cd apps/$APP_NAME

# Always read README if it exists
README_FILE=""
if [ -f "README.md" ]; then
    echo "Found: README.md"
    README_FILE="README.md"
elif [ -f "README" ]; then
    echo "Found: README"
    README_FILE="README"
elif [ -f "readme.md" ]; then
    echo "Found: readme.md"
    README_FILE="readme.md"
fi

# Display README content preview
if [ -n "$README_FILE" ]; then
    echo ""
    echo "=== README Preview ==="
    echo "First 10 lines of $README_FILE:"
    head -10 "$README_FILE" | sed 's/^/  /'
    echo "  ...(truncated)"
    echo ""
fi

# Python projects
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "Python project detected"
    find . -name "main.py" -o -name "app.py" -o -name "__init__.py" | head -3 | while read file; do echo "  Entry point: $file"; done
    find . -name "models.py" -o -name "*models*.py" | head -2 | while read file; do echo "  Models: $file"; done
    find . -name "views.py" -o -name "*views*.py" | head -2 | while read file; do echo "  Views: $file"; done
fi

# Node.js projects
if [ -f "package.json" ]; then
    echo "Node.js project detected"
    find . -name "index.js" -o -name "main.js" -o -name "app.js" | head -3 | while read file; do echo "  Entry point: $file"; done
    find . -name "src" -type d | head -2 | while read dir; do echo "  Source directory: $dir"; done
fi

# Vue/React projects
if find . -name "*.vue" -o -name "*.jsx" -o -name "*.tsx" | head -1 > /dev/null 2>&1; then
    echo "Frontend framework detected"
    find . -name "*.vue" | head -3 | while read file; do echo "  Vue component: $file"; done
    find . -name "*.jsx" -o -name "*.tsx" | head -3 | while read file; do echo "  React component: $file"; done
fi

# Database related
if find . -name "*.sql" -o -name "*migrate*" -o -name "*schema*" | head -1 > /dev/null 2>&1; then
    echo "Database components detected"
    find . -name "*.sql" | head -3 | while read file; do echo "  SQL file: $file"; done
    find . -name "*migrate*" | head -2 | while read file; do echo "  Migration: $file"; done
fi

# Configuration
if [ -f ".env.example" ]; then
    echo "Environment configuration found"
fi

cd ../..
```

**Read these key files (if they exist):**
- README.md (or README, readme.md) - **Now automatically previews first 10 lines**
- package.json (for Node.js projects)
- requirements.txt or pyproject.toml (for Python projects)
- Main application entry points
- Key configuration files
- Any documentation files

## Report

Provide a comprehensive analysis covering:

### App Overview
- **Purpose**: What this app does based on README and code structure
- **Technology Stack**: Primary languages, frameworks, and tools used
- **Architecture**: Overall structure and organization

### Key Components
- **Entry Points**: Main application files and how the app starts
- **Core Logic**: Key business logic and functionality
- **Data Layer**: Database models, schemas, or data handling
- **API/Interfaces**: How this app communicates with other systems

### Dependencies & Configuration
- **External Dependencies**: Key libraries and services it depends on
- **Configuration**: Environment variables, settings, and setup requirements
- **Build/Deployment**: How to build, test, and deploy this app

### Integration Points
- **Internal APIs**: How it connects to other apps in the ecosystem
- **External Services**: Third-party services and integrations
- **Data Flow**: How data moves through this system

### Development Status
- **Maturity**: Based on git history and code organization
- **Active Development**: Recent commits and development activity
- **Documentation Quality**: Availability and quality of documentation

### Recommendations
- **Quick Start**: How to get this app running locally
- **Key Areas to Focus**: Most important parts for understanding the codebase
- **Potential Issues**: Any obvious problems or areas needing attention

## Save Analysis

After completing the analysis, save it for future reference:

```bash
# Create the analysis file
ANALYSIS_FILE="apps/$APP_NAME/APP_ANALYSIS.md"

echo "# $APP_NAME App Analysis Report" > "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"
echo "## Quick Reference" >> "$ANALYSIS_FILE"
echo "- **Technology Stack**: [Detected from analysis]" >> "$ANALYSIS_FILE"
echo "- **Primary Purpose**: [From README/code analysis]" >> "$ANALYSIS_FILE"
echo "- **Key Features**: [Main functionality]" >> "$ANALYSIS_FILE"
echo "- **Entry Points**: [Main files]" >> "$ANALYSIS_FILE"
echo "- **Last Analyzed**: $(date)" >> "$ANALYSIS_FILE"

# Add README content if available
if [ -n "$README_FILE" ] && [ -f "apps/$APP_NAME/$README_FILE" ]; then
    echo "" >> "$ANALYSIS_FILE"
    echo "## README Content" >> "$ANALYSIS_FILE"
    echo "\`\`\`" >> "$ANALYSIS_FILE"
    cat "apps/$APP_NAME/$README_FILE" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    echo "\`\`\`" >> "$ANALYSIS_FILE"
fi

echo "" >> "$ANALYSIS_FILE"
echo "For detailed analysis, run: \`/prime_app $APP_NAME\`" >> "$ANALYSIS_FILE"

echo ""
echo "=== Analysis Saved ==="
echo "Analysis saved to: $ANALYSIS_FILE"
echo "Future /prime_app commands will reference this cached analysis."
echo "Use \`/prime_app --refresh $APP_NAME\` to regenerate the analysis."
```

---

**Variables Used:**
- `$ARGUMENTS`: The app name passed as parameter to the command
- `APP_NAME`: Variable containing the app name for use in the script
- `REFRESH_MODE`: Whether to refresh the cached analysis or use it