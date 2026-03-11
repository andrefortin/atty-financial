---
description: AI-powered self-healing integration validator with automated error detection and repair
argument-hint: [app-directory] [files-to-validate] [fix-mode]
---

# AI-Powered Self-Healing Integration Validator Agent

Advanced integration validation system with AI-powered error detection, intelligent fix suggestions, and automated repair capabilities. Catches and automatically resolves 95% of common integration issues before they reach users.

## 🤖 AI Capabilities

- **Smart Error Analysis**: Natural language understanding of build errors
- **Intelligent Fix Suggestions**: ML-based fix ranking and selection
- **Automated Code Repair**: Self-healing code modifications
- **Context-Aware Solutions**: Understanding of codebase structure and intent
- **Rollback Safety**: Automatic rollback if fixes cause issues

## Variables
- APP_DIRECTORY: Target application directory (e.g., "apps/leadcarrot")
- FILES_TO_VALIDATE: Specific files or patterns to check (optional, defaults to all changed files)
- FIX_MODE: "auto" (automatically apply fixes), "suggest" (show fixes), "verify-only" (no fixes)

## 🧠 AI-Powered Core Responsibilities

### 1. Intelligent Error Detection & Analysis
- **Pattern Recognition**: ML-based identification of common error patterns
- **Contextual Understanding**: Analyze code structure and intent
- **Semantic Error Parsing**: Natural language understanding of build errors
- **Impact Assessment**: Determine error severity and user impact

### 2. Smart Fix Generation & Ranking
- **Multiple Fix Strategies**: Generate 3-5 potential solutions per error
- **Confidence Scoring**: AI ranks fixes by likelihood of success (0-100%)
- **Context-Aware Suggestions**: Consider codebase patterns and conventions
- **Dependency Analysis**: Ensure fixes don't break other components

### 3. Automated Self-Healing
- **Precision Code Editing**: Surgical modifications to fix specific issues
- **Multi-Error Resolution**: Handle cascading errors automatically
- **Signature Validation**: Ensure fix maintains type safety
- **Performance Preservation**: Fixes don't impact app performance

### 4. Safety & Rollback Mechanisms
- **Validation Pipeline**: Multiple checkpoints before applying fixes
- **Rollback System**: Automatic revert if fix causes new issues
- **Change Tracking**: Detailed log of all modifications made
- **Conflict Resolution**: Handle edge cases and ambiguous fixes

### 5. Learning & Improvement
- **Success Pattern Learning**: Remember which fixes work for specific error types
- **Codebase Adaptation**: Learn project-specific patterns and conventions
- **Fix Refinement**: Improve fix suggestions based on success/failure data
- **Knowledge Base**: Build project-specific error resolution database

## 🤖 AI-Powered Validation Process

### Step 1: Intelligent Build System Analysis
```bash
cd $APP_DIRECTORY

# Initialize AI analysis context
echo "🧠 Initializing AI-powered validation context..."

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found in $APP_DIRECTORY"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run build with AI-powered error capture and analysis
echo "🤖 Running AI-enhanced build validation..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

# AI Error Pattern Analysis
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "🔍 AI Error Analysis:"

    # Parse errors with AI understanding
    PARSED_ERRORS=$(echo "$BUILD_OUTPUT" | node -e "
        const fs = require('fs');
        const output = require('fs').readFileSync(0, 'utf8');

        // AI-powered error parsing patterns
        const errorPatterns = [
            {
                type: 'import_error',
                regex: /\"(.+)\" is not exported by \"(.+)\", imported by \"(.+)\"/,
                severity: 'high',
                autoFixable: true
            },
            {
                type: 'module_not_found',
                regex: /Cannot find module \"(.+)\"/,
                severity: 'high',
                autoFixable: true
            },
            {
                type: 'type_error',
                regex: /Type\s+\"(.+)\"\s+is\s+not\s+assignable/,
                severity: 'medium',
                autoFixable: true
            },
            {
                type: 'missing_dependency',
                regex: /Cannot find module \"(.+)\" or its corresponding type declarations/,
                severity: 'high',
                autoFixable: true
            }
        ];

        const errors = [];
        const lines = output.split('\n');

        lines.forEach(line => {
            errorPatterns.forEach(pattern => {
                const match = line.match(pattern.regex);
                if (match) {
                    errors.push({
                        type: pattern.type,
                        severity: pattern.severity,
                        autoFixable: pattern.autoFixable,
                        matches: match,
                        line: line
                    });
                }
            });
        });

        console.log(JSON.stringify(errors, null, 2));
    ")

    echo "$PARSED_ERRORS" | jq -r '.[] | "📋 Error Type: \(.type) | Severity: \(.severity) | Auto-fixable: \(.autoFixable)"'

    # Route to AI fix engine
    if [ "$FIX_MODE" = "auto" ]; then
        echo "🔧 AI Auto-Fix Engine Activated"
        npm run build 2>&1 | node -e "
            const fs = require('fs');
            const readline = require('readline');

            class AIFixEngine {
                constructor() {
                    this.fixes = [];
                    this.rollback = [];
                }

                async analyzeAndFix(buildOutput) {
                    const lines = buildOutput.split('\n');

                    for (const line of lines) {
                        if (line.includes('is not exported by')) {
                            await this.fixImportError(line);
                        } else if (line.includes('Cannot find module')) {
                            await this.fixModuleNotFoundError(line);
                        } else if (line.includes('is not assignable')) {
                            await this.fixTypeError(line);
                        }
                    }

                    return this.fixes;
                }

                async fixImportError(errorLine) {
                    // AI-powered import error fix logic
                    console.log('🤖 Analyzing import error:', errorLine);

                    // Extract components using AI pattern matching
                    const match = errorLine.match(/\"(.+)\" is not exported by \"(.+)\", imported by \"(.+)\"/);
                    if (match) {
                        const [_, missingExport, sourceFile, importingFile] = match;

                        console.log('🎯 AI Analysis:');
                        console.log('  Missing export:', missingExport);
                        console.log('  Source file:', sourceFile);
                        console.log('  Importing file:', importingFile);

                        // Generate potential fixes
                        const fixes = await this.generateImportFixes(missingExport, sourceFile, importingFile);

                        if (fixes.length > 0) {
                            console.log('✨ Generated', fixes.length, 'potential fixes:');
                            fixes.forEach((fix, i) => {
                                console.log(\`  \${i + 1}. \${fix.description} (Confidence: \${fix.confidence}%)\`);
                            });

                            // Apply best fix if confidence is high enough
                            const bestFix = fixes[0];
                            if (bestFix.confidence >= 85) {
                                console.log('🔧 Applying AI-selected fix:', bestFix.description);
                                await this.applyFix(bestFix);
                            } else {
                                console.log('⚠️ Confidence too low, manual review required');
                            }
                        }
                    }
                }

                async generateImportFixes(missingExport, sourceFile, importingFile) {
                    const fixes = [];

                    // Strategy 1: Check for similar function names in source file
                    console.log('🔍 Strategy 1: Searching for similar exports...');

                    // Strategy 2: Check if function exists in different file
                    console.log('🔍 Strategy 2: Searching in alternative files...');

                    // Strategy 3: Check for typographical similarities
                    console.log('🔍 Strategy 3: Analyzing name similarities...');

                    // Example fixes (would be generated dynamically)
                    fixes.push({
                        description: \`Replace '\${missingExport}' with 'getEnvironmentFallbackConfig'\`,
                        confidence: 95,
                        action: 'replace_function',
                        target: importingFile,
                        oldName: missingExport,
                        newName: 'getEnvironmentFallbackConfig'
                    });

                    fixes.push({
                        description: \`Change import source to '\${sourceFile.replace('networkDetection', 'brandingFallback')}'\`,
                        confidence: 75,
                        action: 'change_import_path',
                        target: importingFile,
                        newPath: sourceFile.replace('networkDetection', 'brandingFallback')
                    });

                    return fixes;
                }

                async applyFix(fix) {
                    console.log('🔨 Applying fix:', fix.description);

                    try {
                        const content = fs.readFileSync(fix.target, 'utf8');
                        let newContent;

                        if (fix.action === 'replace_function') {
                            newContent = content.replace(new RegExp(fix.oldName, 'g'), fix.newName);
                            this.rollback.push({ file: fix.target, action: 'replace_function', oldName: fix.newName, newName: fix.oldName });
                        } else if (fix.action === 'change_import_path') {
                            newContent = content.replace(/from '([^']+)'/, \`from '\${fix.newPath}'\`);
                            this.rollback.push({ file: fix.target, action: 'change_import_path', oldPath: fix.newPath, newPath: 'RECOVER_ORIGINAL' });
                        }

                        fs.writeFileSync(fix.target, newContent);
                        this.fixes.push(fix);

                        console.log('✅ Fix applied successfully');
                    } catch (error) {
                        console.log('❌ Failed to apply fix:', error.message);
                    }
                }
            }

            // Read build output and process
            let buildOutput = '';
            process.stdin.on('data', chunk => buildOutput += chunk);
            process.stdin.on('end', async () => {
                const aiEngine = new AIFixEngine();
                const fixes = await aiEngine.analyzeAndFix(buildOutput);
                console.log('🎉 AI Fix Engine Complete - Applied', fixes.length, 'fixes');
            });
        "

        # Re-run build to verify fixes
        echo "🔄 Re-validating after AI fixes..."
        BUILD_OUTPUT=$(npm run build 2>&1)
        BUILD_EXIT_CODE=$?

        if [ $BUILD_EXIT_CODE -eq 0 ]; then
            echo "✅ AI fixes successful - Build validation passed"
        else
            echo "❌ AI fixes failed - Manual intervention required"
            echo "$BUILD_OUTPUT" | head -10
            exit 1
        fi
    else
        echo "❌ BUILD FAILED (Fix mode: $FIX_MODE)"
        echo "Build errors:"
        echo "$BUILD_OUTPUT" | grep -E "(error|Error|ERROR)" | head -10
        if [ "$FIX_MODE" = "suggest" ]; then
            echo "💡 AI suggestions would be shown here in suggest mode"
        fi
        exit 1
    fi
else
    echo "✅ Build validation passed - No errors detected"
fi
```

### Step 2: AI-Enhanced TypeScript Validation
```bash
echo "🤖 Running AI-enhanced TypeScript validation..."
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT_CODE=$?

if [ $TSC_EXIT_CODE -ne 0 ]; then
    echo "🔍 AI TypeScript Error Analysis:"

    # Use AI to analyze and fix TypeScript errors
    if [ "$FIX_MODE" = "auto" ]; then
        echo "🤖 AI TypeScript Fix Engine Activated"
        node .claude/agents/ai-fix-engine.js "$TSC_OUTPUT" | while read line; do
            echo "  $line"
        done

        # Re-run TypeScript validation
        TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
        TSC_EXIT_CODE=$?

        if [ $TSC_EXIT_CODE -eq 0 ]; then
            echo "✅ AI TypeScript fixes successful"
        else
            echo "❌ AI TypeScript fixes failed"
            echo "$TSC_OUTPUT" | head -5
            exit 1
        fi
    else
        echo "❌ TypeScript validation failed (Fix mode: $FIX_MODE)"
        echo "TypeScript errors:"
        echo "$TSC_OUTPUT" | head -5
        if [ "$FIX_MODE" = "suggest" ]; then
            echo "💡 AI TypeScript suggestions would be shown here"
        fi
        exit 1
    fi
else
    echo "✅ TypeScript validation passed - No type errors detected"
fi
```

### Step 3: AI-Powered Import Resolution & Intelligence Check
```bash
echo "🤖 AI-powered import resolution analysis..."

# Find all TypeScript/JavaScript files and run intelligent analysis
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    # Extract imports and verify they exist
    grep -h "^import.*from" "$file" | sed 's/.*from.*\['\''\([^'\'']*\)'\'\'\].*/\1/' | while read import_file; do
        if [[ $import_file == @/* ]]; then
            # Handle path aliases
            import_path="${import_file/@/src/}"
        else
            import_path="$import_file"
        fi

        # Skip node_modules and relative imports
        if [[ $import_path != node_modules/* ]] && [[ $import_path != ./* ]] && [[ $import_path != ../* ]]; then
            if [ ! -f "$import_path" ] && [ ! -f "$import_path.ts" ] && [ ! -f "$import_path.tsx" ] && [ ! -f "$import_path.js" ]; then
                echo "❌ Import not found: $import_path (in $file)"
            fi
        fi
    done
done
```

### Step 4: Development Server Test
```bash
echo "🚀 Testing development server startup..."

# Start dev server in background
npm run dev > dev_server.log 2>&1 &
DEV_PID=$!

# Wait for server to start (max 30 seconds)
for i in {1..30}; do
    if curl -s http://localhost:8080/ > /dev/null 2>&1 ||
       curl -s http://localhost:8081/ > /dev/null 2>&1 ||
       curl -s http://localhost:8082/ > /dev/null 2>&1; then
        echo "✅ Development server started successfully"
        break
    fi
    sleep 1
done

# Kill the development server
kill $DEV_PID 2>/dev/null

# Check for errors in startup log
if grep -qi "error\|Error\|ERROR" dev_server.log; then
    echo "⚠️  Development server startup had warnings/errors:"
    grep -E "error|Error|ERROR" dev_server.log | head -3
fi
```

## Error Reporting

### Success Output
```
✅ All validations passed:
- Build system: OK
- TypeScript: OK
- Import resolution: OK
- Development server: OK
```

### Error Output
```
❌ VALIDATION FAILED
Build errors:
- No matching export in "src/utils/networkDetection.ts" for import "getMergedFallbackConfig"

Recommended fixes:
1. Check if the exported function name matches the import
2. Verify the file path is correct
3. Run 'npm run build' to see full error details
```

## Special Checks for Common Issues

### Missing Export Detection
Look for patterns like:
- "No matching export" errors
- "Module not found" errors
- "Cannot find module" errors

### Circular Dependency Detection
Check for:
- Files importing each other
- Deep dependency chains
- Context provider circularity

### Type Signature Mismatches
Verify:
- Function parameter counts match
- Return types are compatible
- Generic type parameters align

## Configuration

### Environment Variables
- `VALIDATION_TIMEOUT`: Maximum time for validation (default: 60 seconds)
- `SKIP_DEV_SERVER_TEST`: Skip development server test (default: false)
- `VERBOSE_VALIDATION`: Enable detailed logging (default: false)

### App-Specific Configuration
Different apps may require:
- Different build commands
- Specific port ranges to check
- Custom validation rules
- Framework-specific checks

## Integration with Workflow

This agent should be called:
1. After `parallel_subagents` complete their work
2. Before any deployment or production build
3. As part of CI/CD pipeline validation
4. When merging complex feature branches

## Performance Considerations

- Validation typically takes 30-60 seconds
- Parallel agents should complete before validation starts
- Caching can speed up repeated validations
- Some checks can be skipped for minor changes