# Project Tree

This document shows the directory and file structure of the fb-re-agent project.

```
.
├── apps/                              # Main application monorepo
│   ├── backend/                       # NestJS backend API
│   │   ├── src/                       # Source code
│   │   ├── test/                      # Test files
│   │   ├── APP_ANALYSIS.md            # Architecture analysis
│   │   ├── .env                       # Environment variables
│   │   ├── .env.example               # Environment template
│   │   ├── nest-cli.json              # NestJS CLI config
│   │   ├── package.json               # Dependencies
│   │   ├── README.md                  # Backend documentation
│   │   └── tsconfig.json              # TypeScript config
│   ├── clerk-chrome-extension-quickstart/  # Clerk auth quickstart
│   │   ├── assets/                    # Static assets
│   │   ├── src/                       # Source code
│   │   ├── .env.*                     # Environment files
│   │   ├── package.json               # Dependencies
│   │   ├── tailwind.config.js         # Tailwind CSS config
│   │   └── README.md                  # Documentation
│   ├── _fb-re-poster/                 # Facebook real estate poster extension
│   │   ├── assets/                    # Static assets
│   │   ├── js/                        # JavaScript content scripts
│   │   ├── manifest.json              # Extension manifest
│   │   ├── package.json               # Dependencies
│   │   ├── popup.html                 # Extension popup UI
│   │   ├── README.md                  # Documentation
│   │   └── styles.css                 # Extension styles
│   ├── frontend/                      # React frontend (Vite)
│   │   ├── src/                       # Source code
│   │   ├── APP_ANALYSIS.md            # Architecture analysis
│   │   ├── index.html                 # Entry HTML
│   │   ├── package.json               # Dependencies
│   │   ├── tailwind.config.js         # Tailwind CSS config
│   │   ├── vite.config.ts             # Vite config
│   │   └── README.md                  # Frontend documentation
│   ├── landing/                       # Next.js landing page
│   │   ├── src/                       # Source code
│   │   ├── APP_ANALYSIS.md            # Architecture analysis
│   │   ├── next.config.js             # Next.js config
│   │   ├── package.json               # Dependencies
│   │   └-- README.md                  # Landing page documentation
│   ├── mobile/                        # Mobile app
│   │   ├── app.json                   # App config
│   │   └-- README.md                  # Mobile documentation
│   └── plugin/                        # Chrome extension (main)
│       ├── assets/                    # Extension assets
│       ├── docs/                      # Plugin documentation
│       ├── fb-plugin/                 # Facebook-specific code
│       ├── icons/                     # Extension icons
│       ├── screenshots/               # Screenshots
│       ├── scripts/                   # Build/utility scripts
│       ├── src/                       # Source code
│       ├── tests/                     # Test files
│       ├── APP_ANALYSIS.md            # Architecture analysis
│       ├── AUTH_TESTING_GUIDE.md      # Auth testing docs
│       ├── manifest.json              # Extension manifest
│       ├── offscreen.html             # Offscreen document
│       ├── package.json               # Dependencies
│       ├── popup.html                 # Extension popup
│       ├── sidepanel.html             # Side panel UI
│       ├── tailwind.config.js         # Tailwind CSS config
│       ├── TAILWIND_SETUP.md          # Tailwind setup guide
│       └-- README.md                  # Plugin documentation
├── convex/                           # Convex database
│   ├── convex/                       # Convex functions
│   │   └── _generated/              # Generated files
│   ├── auth.config.ts                # Auth configuration
│   ├── auth.ts                      # Auth implementation
│   ├── integrations.ts              # Integration functions
│   ├── listings.ts                  # Listing functions
│   ├── savedSearches.ts             # Saved search functions
│   ├── schema.ts                    # Database schema
│   ├── subscriptions.ts             # Subscription functions
│   ├── teams.ts                     # Team functions
│   ├── templates.ts                 # Template functions
│   ├── users.ts                     # User functions
│   └-- package.json                 # Dependencies
├── docs/                            # Shared documentation
│   ├── ai-description-anonymize-instructions.md  # AI description prompts
│   │   └-- AI description anonymization instructions
│   ├── ai-image-anonymize-instructions.md        # AI image prompts
│   │   └-- AI image anonymization instructions
│   ├── ai-image-instructions.md                  # AI image generation
│   │   └-- AI image generation instructions
│   ├── ENVIRONMENT_SETUP.md                     # Environment setup guide
│   │   └-- Environment setup guide
│   └-- REUSED_CODE_V0.3.md                       # Reusable code patterns
│       └-- Reusable code V0.3 patterns
├── extensions/                      # Pi coding agent extensions
│   ├── agent-chain.ts              # Agent chaining extension
│   ├── agent-team.ts               # Team coordination extension
│   ├── cross-agent.ts              # Cross-agent communication
│   ├── damage-control.ts           # Damage control system
│   ├── minimal.ts                 # Minimal extension example
│   ├── pi-pi.ts                   # Meta-agent builder
│   ├── pure-focus.ts              # Focus mode extension
│   ├── purpose-gate.ts           # Purpose gating
│   ├── session-replay.ts          # Session replay
│   ├── subagent-widget.ts        # Subagent UI widget
│   ├── system-select.ts          # System selector
│   ├── theme-cycler.ts           # Theme cycling
│   ├── themeMap.ts               # Theme mappings
│   ├── tilldone.ts               # Task completion tracking
│   ├── tool-counter.ts           # Tool usage counter
│   └-- tool-counter-widget.ts   # Tool counter UI
├── images/                        # Project images
│   ├── batman-logo.png
│   ├── pi-logo.png
│   ├── pi-logo.svg
│   ├── profile-photo-robo-andre.png
│   └-- [various project images]
├── logs/                          # Log files
│   ├── notification.json
│   ├── post_tool_use.json
│   ├── pre_tool_use.json
│   ├── status_line.json
│   └-- [other log files]
├── .claude/                       # Claude Code configuration
│   ├── agents/                    # Agent definitions
│   │   ├── ai-fix-engine.js
│   │   ├── auth-implementer.md
│   │   ├── build-agent.md
│   │   ├── docs-scraper.md
│   │   ├── integration-validator.md
│   │   ├── meta-agent.md
│   │   ├── playwright-validator.md
│   │   ├── scout-report-suggest.md
│   │   └-- ui-architect.md
│   ├── commands/                  # Custom commands
│   │   ├── e2e/                  # E2E test commands
│   │   ├── adw_log.md
│   │   ├── bugfix.md
│   │   ├── build.md
│   │   ├── commit.md
│   │   ├── feature.md
│   │   ├── install_worktree.md
│   │   ├── plan.md
│   │   ├── review.md
│   │   └-- test.md
│   │       └-- Test execution commands
│   ├── hooks/                     # Hook scripts
│   │   ├── utils/
│   │   ├── notification.py
│   │   ├── post_tool_use.py
│   │   ├── pre_compact.py
│   │   ├── pre_tool_use.py
│   │   ├── session_start.py
│   │   └-- [other hooks]
│   ├── output-styles/            # Output style templates
│   │   ├── bullet-points.md
│   │   ├── genui.md
│   │   ├── table-based.md
│   │   ├── ultra-concise.md
│   │   └-- [other styles]
│   ├── skills/                   # Skill definitions
│   │   ├── meta-agent/
│   │   └-- ui-architect/
│   └-- status_lines/             # Status line configs
├── .pi/                          # Pi coding agent configuration
│   ├── agents/                   # Pi agent definitions
│   │   ├── pi-pi/               # Meta-agent subagents
│   │   │   ├── agent-expert.md
│   │   │   ├── cli-expert.md
│   │   │   ├── config-expert.md
│   │   │   ├── ext-expert.md
│   │   │   ├── keybinding-expert.md
│   │   │   ├── pi-orchestrator.md
│   │   │   ├── prompt-expert.md
│   │   │   ├── skill-expert.md
│   │   │   ├── tui-expert.md
│   │   │   └-- theme-expert.md
│   │   ├── agent-chain.yaml
│   │   ├── bowser.md
│   │   ├── builder.md
│   │   ├── documenter.md
│   │   ├── planner.md
│   │   ├── plan-reviewer.md
│   │   ├── red-team.md
│   │   ├── reviewer.md
│   │   ├── scout.md
│   │   └-- teams.yaml
│   ├── agent-sessions/           # Agent session data
│   ├── themes/                   # Pi themes
│   │   ├── catppuccin-mocha.json
│   │   ├── cyberpunk.json
│   │   ├── dracula.json
│   │   ├── everforest.json
│   │   ├── gruvbox.json
│   │   ├── midnight-ocean.json
│   │   ├── nord.json
│   │   ├── ocean-breeze.json
│   │   ├── rose-pine.json
│   │   ├── synthwave.json
│   │   └-- tokyo-night.json
│   └-- skills/                   # Pi skills
│       └-- playright-bowser/
├── specs/                        # Feature specifications
│   ├── old-specs/               # Historical specs
│   │   └-- [200+ specification files]
│   ├── agent-forge.md           # Agent forge spec
│   ├── agent-workflow.md        # Agent workflow spec
│   ├── damage-control.md        # Damage control spec
│   ├── fb-attachment-extraction-improvement.md
│   ├── fb-marketplace-form-fill-fix.md
│   ├── pi-pi.md                # Meta-agent spec
│   └-- posting-options-template-and-persona-selection.md
├── .env                         # Environment variables
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── bun.lock                    # Bun lockfile
├── CHANGELOG.md                # Project changelog
├── CLAUDE.md                   # Claude Code agent config
├── COMPARISON.md               # Claude Code vs Pi comparison
├── justfile                    # Just task runner recipes
├── .npmrc                      # npm configuration
├── package.json                # Root package.json
├── README-copy.md              # README backup
├── README.md                   # Main project README
├── RESERVED_KEYS.md            # Pi reserved keybindings
├── THEME.md                    # Pi theme documentation
├── TOOLS.md                    # Pi built-in tools reference
└-- turbo.json                  # Turborepo configuration
```

## Summary

- **Total directories**: 56
- **Total files**: 544 (excluding node_modules, .git, and build artifacts)
- **Main apps**: 6 (backend, frontend, landing, mobile, plugin, quickstart)
- **Extensions**: 13 Pi coding agent extensions
- **Themes**: 11 Pi themes
- **Specs**: 200+ feature specifications

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `apps/` | Main application monorepo |
| `convex/` | Convex database functions and schema |
| `extensions/` | Pi coding agent extensions |
| `specs/` | Feature specifications and plans |
| `.claude/` | Claude Code agents, commands, hooks |
| `.pi/` | Pi coding agent configuration |
| `docs/` | Shared documentation |
| `logs/` | Application logs |
