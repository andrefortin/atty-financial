# Brand Documentation Guide for Human Developers & AI Agents

This guide provides actionable guidelines for writing brand documentation that is optimal for both human developers and AI coding agents.

## Table of Contents

1. [Overview](#overview)
2. [Writing Style & Structure](#writing-style--structure)
3. [Machine-Readable Data Structures](#machine-readable-data-structures)
4. [Markdown Formatting Best Practices](#markdown-formatting-best-practices)
5. [Code Examples & Formatting](#code-examples--formatting)
6. [Color Documentation](#color-documentation)
7. [Typography Documentation](#typography-documentation)
8. [Token Documentation](#token-documentation)
9. [Before/After Examples](#beforeafter-examples)

---

## Overview

### Why Dual-Optimized Documentation Matters

**For Human Developers:**
- Clear explanations and rationale
- Visual examples and context
- Easy to scan and reference
- Design system thinking

**For AI Coding Agents:**
- Structured data that can be parsed
- Consistent naming conventions
- Code snippets ready for generation
- Relationships between tokens
- Machine-readable formats alongside text

### Key Principles

| Principle | Human Benefit | AI Benefit |
|-----------|----------------|------------|
| **Explicit naming** | Clear intent | Precise matching |
| **Structured data** | Reference tables | JSON/YAML parsing |
| **Code examples** | Copy-paste ready | Direct generation |
| **Context tags** | Understanding | Semantic meaning |
| **Version tracking** | Change history | Conflict resolution |

---

## Writing Style & Structure

### 1. Hierarchical Organization

Use consistent heading levels with descriptive names:

```markdown
# Brand System
├── ## Colors
│   ├── ### Primary
│   │   └── #### Definition
│   │   └── #### Usage Guidelines
│   ├── ### Semantic Colors
│   │   └── #### Status Colors
│   │   └── #### Feedback Colors
│   └── ### Dark Mode
├── ## Typography
│   ├── ### Type Scale
│   ├── ### Font Families
│   └── ### Usage Guidelines
└── ## Spacing & Layout
    ├── ### Spacing Scale
    └── ├── ### Component Spacing
```

### 2. Consistent Section Structure

Each token or group should follow this pattern:

```markdown
### [Token Name]

**Purpose:** One-sentence description of what this token represents.

**Value:** Actual value (hex, pixel, rem, etc.)

**CSS Variable:** `--variable-name`

**Usage:** When and where to use this token.

**Alternatives:** Related tokens to consider.

**Accessibility:** Contrast ratios, WCAG compliance.

**Example:** Code snippet showing usage.

---
```

### 3. Descriptive Naming Conventions

Use semantic, descriptive names that convey purpose:

| ❌ Poor | ✅ Good | Reason |
|--------|---------|--------|
| `blue-1` | `primary-500` | Semantic intent |
| `text-color` | `text-primary` | Hierarchy clear |
| `padding-medium` | `spacing-4` | Scalable system |
| `font-large` | `text-2xl` | Type scale reference |
| `hover-bg` | `primary-hover` | State explicit |

### 4. Explicit Relationships

Document relationships between tokens:

```markdown
### Primary Blue-500

**Base Token:** `--color-primary-500`

**Derived From:**
- `--color-primary-400` (lighter variant)
- `--color-primary-600` (darker variant)

**Used In:**
- Primary buttons
- Active navigation items
- Interactive elements

**Related Tokens:**
- `--color-primary-500-hover` (for :hover states)
- `--color-primary-500-active` (for :active states)
- `--color-primary-500-disabled` (for disabled states)
```

---

## Machine-Readable Data Structures

### 1. YAML/JSON Data Blocks

Include machine-readable versions alongside human-readable documentation:

```markdown
<!-- BEGIN: YAML DATA -->
```yaml
colors:
  primary:
    base:
      name: "Primary Blue"
      value: "#1E3A5F"
      css-variable: "--color-primary"
      rgb: "30, 58, 95"
      hsl: "219, 52%, 24%"
      contrast-light: "12.5:1"
      contrast-dark: "1.7:1"
    variants:
      50: { value: "#E8EDF2", css-variable: "--color-primary-50" }
      100: { value: "#D1DBE6", css-variable: "--color-primary-100" }
      # ...
  semantic:
    success:
      value: "#48BB78"
      css-variable: "--color-success"
      usage: "success states, positive feedback"
    warning:
      value: "#F6AD55"
      css-variable: "--color-warning"
      usage: "warning states, caution"
```
<!-- END: YAML DATA -->
```

### 2. Token Reference Format

Use a consistent format that can be parsed:

```markdown
## Token Reference

### Color Tokens

| Token | Value | CSS Variable | Usage | Contrast | Status |
|-------|-------|--------------|-------|----------|--------|
| `primary` | #1E3A5F | `--color-primary` | Brand color, headers | 12.5:1 | Stable |
| `primary-light` | #2D5B87 | `--color-primary-light` | Secondary brand elements | 8.3:1 | Stable |
| `accent` | #4FD1C5 | `--color-accent` | CTAs, highlights | 3.1:1 | Stable |
| `success` | #48BB78 | `--color-success` | Success states | 4.6:1 | Stable |
| `warning` | #F6AD55 | `--color-warning` | Warning states | 2.5:1 | Stable |
| `error` | #FC8181 | `--color-error` | Error states | 3.1:1 | Stable |
```

### 3. Structured Component Documentation

Document components with a machine-friendly structure:

```markdown
## Component: Button

### Metadata

```json
{
  "component": "Button",
  "category": "interactive",
  "status": "stable",
  "version": "1.0.0",
  "tokens": {
    "primary": {
      "background": "--color-primary",
      "text": "--color-white",
      "hover": "--color-primary-dark",
      "disabled": "--color-gray-300"
    },
    "secondary": {
      "background": "--color-gray-100",
      "text": "--color-gray-900",
      "hover": "--color-gray-200",
      "disabled": "--color-gray-50"
    }
  },
  "variants": ["primary", "secondary", "ghost", "danger"],
  "sizes": ["sm", "md", "lg"],
  "states": ["default", "hover", "active", "disabled", "loading"]
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `leftIcon` | `ReactNode` | `undefined` | Icon on the left side |
| `rightIcon` | `ReactNode` | `undefined` | Icon on the right side |

### Token Mapping

```css
/* Primary Button */
.button--primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
}

.button--primary:hover {
  background: var(--color-primary-dark);
}

.button--primary:active {
  background: var(--color-primary-light);
}

.button--primary:disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-500);
}
```
```

---

## Markdown Formatting Best Practices

### 1. Code Block Language Tags

Always specify language for syntax highlighting:

```markdown
```css
/* CSS code */
```

```typescript
// TypeScript code
```

```json
// JSON data
```

```yaml
# YAML configuration
```
```

### 2. Inline Code for Token Names

Use backticks for all token references:

```markdown
Use `--color-primary` for brand colors.
Apply `--spacing-4` for standard padding.
Set font size with `--text-lg`.
```

### 3. Tables for Reference Data

Use tables for lookup-style data:

```markdown
### Spacing Scale

| Token | Value | Rem | Pixels | Usage |
|-------|-------|-----|--------|-------|
| `spacing-0` | 0 | 0rem | 0px | Remove spacing |
| `spacing-1` | 0.25rem | 0.25rem | 4px | Tight spacing |
| `spacing-2` | 0.5rem | 0.5rem | 8px | Small spacing |
| `spacing-3` | 0.75rem | 0.75rem | 12px | Medium-small |
| `spacing-4` | 1rem | 1rem | 16px | Standard spacing |
| `spacing-6` | 1.5rem | 1.5rem | 24px | Medium spacing |
| `spacing-8` | 2rem | 2rem | 32px | Large spacing |
| `spacing-12` | 3rem | 3rem | 48px | Extra large |
```

### 4. Lists with Consistent Formatting

```markdown
### Usage Guidelines

**Do:**
- Use `--color-primary` for primary actions
- Maintain 4.5:1 minimum contrast ratio
- Test in both light and dark modes

**Don't:**
- Don't use semantic colors for decoration only
- Don't hardcode hex values in components
- Don't rely on color alone to convey meaning
```

### 5. Callout Boxes for Important Notes

```markdown
> **Accessibility Note**
> Always ensure text on colored backgrounds meets WCAG AA standards
> (4.5:1 for normal text, 3:1 for large text).

> **Deprecated**
> This token is deprecated. Use `--color-primary-500` instead.

> **Experimental**
> This token is experimental and may change without notice.
```

---

## Code Examples & Formatting

### 1. Complete, Copy-Pasteable Examples

Provide full, working examples:

```typescript
// ✅ Good - Complete example
function Button({ variant = 'primary', size = 'md', children, ...props }) {
  const baseStyles = {
    padding: variant === 'sm' ? 'var(--spacing-2) var(--spacing-4)' :
              variant === 'lg' ? 'var(--spacing-4) var(--spacing-6)' :
              'var(--spacing-3) var(--spacing-5)',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'var(--transition-base)',
  };

  const variantStyles = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-white)',
      border: '1px solid var(--color-primary)',
    },
    secondary: {
      background: 'var(--color-gray-100)',
      color: 'var(--color-gray-900)',
      border: '1px solid var(--color-gray-200)',
    },
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      {...props}
    >
      {children}
    </button>
  );
}

// ❌ Bad - Fragmented, incomplete
function Button({ variant }) {
  return <button className={variant}>Click</button>;
}
```

### 2. Multi-Language Examples

Show the same concept in multiple implementation styles:

```typescript
// TypeScript with CSS Variables
const styles = {
  button: {
    background: 'var(--color-primary)',
    padding: 'var(--spacing-3) var(--spacing-5)',
  },
};
```

```css
/* Pure CSS */
.button {
  background: var(--color-primary);
  padding: var(--spacing-3) var(--spacing-5);
}
```

```css
/* Tailwind CSS (if applicable) */
.button-primary {
  @apply bg-primary px-[var(--spacing-3)] py-[var(--spacing-5)];
}
```

### 3. Before/After Code Snippets

Show the transformation from hardcoded to tokenized:

```typescript
// ❌ Before: Hardcoded values
function Header({ title }) {
  return (
    <header style={{
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #E2E8F0',
      backgroundColor: '#1E3A5F',
      color: '#FFFFFF',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
        {title}
      </h1>
    </header>
  );
}

// ✅ After: Using design tokens
function Header({ title }) {
  return (
    <header style={{
      padding: 'var(--spacing-4) var(--spacing-6)',
      borderBottom: '1px solid var(--color-gray-200)',
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-white)',
    }}>
      <h1 style={{
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)'
      }}>
        {title}
      </h1>
    </header>
  );
}
```

### 4. Commented Examples

Explain inline what's happening:

```typescript
function Card({ title, children }) {
  return (
    <div
      // Container uses card shadow and radius tokens
      style={{
        boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--radius-lg)',
        // Card padding is larger than standard spacing
        padding: 'var(--card-padding)',
        // Background uses the lightest gray
        backgroundColor: 'var(--color-white)',
      }}
    >
      {/* Title uses heading font weight and size */}
      <h2
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          // Spacing between title and content
          marginBottom: 'var(--spacing-3)',
          color: 'var(--color-gray-900)',
        }}
      >
        {title}
      </h2>
      {/* Content uses body text styling */}
      <div
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-gray-700)',
          lineHeight: '1.5',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## Color Documentation

### Structure

```markdown
## Colors

### Primary Colors

#### Primary Blue

**CSS Variable:** `--color-primary`

**Value:** `#1E3A5F`

**Purpose:** Primary brand color for main actions and branding.

**Color Palette:**
```yaml
primary:
  50:  "#E8EDF2"  --color-primary-50
  100: "#D1DBE6"  --color-primary-100
  200: "#A4B6CD"  --color-primary-200
  300: "#7791B5"  --color-primary-300
  400: "#4B6C9C"  --color-primary-400
  500: "#1E3A5F"  --color-primary
  600: "#172D49"  --color-primary-600
  700: "#112133"  --color-primary-700
  800: "#0B151D"  --color-primary-800
  900: "#05090B"  --color-primary-900
```

**Contrast Ratios:**
- On white: 12.5:1 (AAA)
- On primary-50: 8.2:1 (AAA)
- On primary-100: 5.1:1 (AAA)

**Usage:**
- Primary buttons and CTAs
- Active navigation items
- Links and interactive elements
- Page headers and branding

**Avoid:**
- Large background areas (too dark)
- Text on dark backgrounds (use white instead)

**Pairs Well With:**
- `--color-white` (text and backgrounds)
- `--color-accent` (highlights and emphasis)
- `--color-gray-100` (subtle backgrounds)

---

#### Primary Blue - Light Variant

**CSS Variable:** `--color-primary-light`

**Value:** `#2D5B87`

**Purpose:** Lighter variant for secondary brand elements.

**Derivation:** 30% lighter than primary base.

**Usage:**
- Secondary buttons
- Hover states on primary elements
- Subsection headers
- Decorative elements

---

### Semantic Colors

#### Success

**CSS Variable:** `--color-success`

**Value:** `#48BB78`

**Purpose:** Success states, positive feedback, completed actions.

**Contrast on white:** 4.6:1 (AA)

**Usage:**
- Success messages and toasts
- Completed status badges
- Positive metrics and trends
- Checkmarks and confirmations

**States:**
- `--color-success`: Base success state
- `--color-success-light`: Hover state
- `--color-success-dark`: Active state
- `--color-success-bg`: Background for success banners

---

#### Warning

**CSS Variable:** `--color-warning`

**Value:** `#F6AD55`

**Purpose:** Warning states, caution, attention required.

**Contrast on white:** 2.5:1 (AA for large text only)

**Usage:**
- Warning messages
- Attention badges
- Low priority alerts
- Pending states

**Note:** Use dark text on this background for better contrast:
```css
.warning-banner {
  background: var(--color-warning);
  color: var(--color-gray-900); /* Dark text for contrast */
}
```

---

#### Error

**CSS Variable:** `--color-error`

**Value:** `#FC8181`

**Purpose:** Error states, destructive actions, failures.

**Contrast on white:** 3.1:1 (AA)

**Usage:**
- Error messages
- Delete/destroy actions
- Failed status badges
- Validation errors

---

### Neutral Colors

#### Gray Scale

**CSS Variables:** `--color-gray-{50-900}`

**Purpose:** Neutral backgrounds, borders, text, and UI elements.

```yaml
gray:
  50:  "#F7FAFC"  Backgrounds, subtle fills
  100: "#EDF2F7"  Light backgrounds, borders
  200: "#E2E8F0"  Borders, dividers
  300: "#CBD5E0"  Subtle borders, disabled elements
  400: "#A0AEC0"  Secondary text, placeholders
  500: "#718096"  Secondary text, captions
  600: "#4A5568"  Body text, secondary headings
  700: "#2D3748"  Primary text, headings
  800: "#1A202C"  Headings, emphasized text
  900: "#171923"  Headings, high contrast text
```

**Text Hierarchy:**
- `--color-gray-900`: Page titles, H1
- `--color-gray-800`: Section headings, H2-H3
- `--color-gray-700`: Body text, paragraphs
- `--color-gray-600`: Secondary text, labels
- `--color-gray-500`: Supporting text, timestamps
- `--color-gray-400`: Placeholder text, disabled text

**Background Hierarchy:**
- `--color-white`: Primary background
- `--color-gray-50`: Alternate section backgrounds
- `--color-gray-100`: Card backgrounds, containers
- `--color-gray-200`: Hover backgrounds, subtle fills

---

### Status Colors

**Purpose:** Predefined color combinations for status indicators.

```yaml
status:
  active:
    background: "var(--status-active-bg)"      #C6F6D5
    text: "var(--status-active-text)"          #22543D

  closed:
    background: "var(--status-closed-bg)"      #FEEBC8
    text: "var(--status-closed-text)"          #744210

  pending:
    background: "var(--status-pending-bg)"     #FEEBC8
    text: "var(--status-pending-text)"         #744210

  error:
    background: "var(--status-error-bg)"       #FED7D7
    text: "var(--status-error-text)"           #742A2A

  unassigned:
    background: "var(--status-unassigned-bg)" #FED7D7
    text: "var(--status-unassigned-text)"     #742A2A

  assigned:
    background: "var(--status-assigned-bg)"    #BEE3F8
    text: "var(--status-assigned-text)"        #2C5282

  allocated:
    background: "var(--status-allocated-bg)"  #C6F6D5
    text: "var(--status-allocated-text)"      #22543D
```

**Usage:**
```typescript
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        background: `var(--status-${status.toLowerCase()}-bg)`,
        color: `var(--status-${status.toLowerCase()}-text)`,
        padding: 'var(--spacing-1) var(--spacing-3)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      {status}
    </span>
  );
}
```

---

### Dark Mode

**CSS Variables for Dark Mode:**

```css
:root {
  /* Light mode (default) */
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
}

[data-theme="dark"] {
  /* Dark mode overrides */
  --color-bg-primary: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-text-primary: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-400);
}
```

**Dark Mode Color Mappings:**

| Light Mode | Dark Mode | Purpose |
|------------|-----------|---------|
| `--color-white` | `--color-gray-900` | Primary background |
| `--color-gray-50` | `--color-gray-800` | Secondary background |
| `--color-gray-100` | `--color-gray-700` | Card backgrounds |
| `--color-gray-900` | `--color-gray-100` | Primary text |
| `--color-gray-700` | `--color-gray-300` | Secondary text |
| `--color-gray-200` | `--color-gray-600` | Borders |

**Implementation:**
```typescript
// Auto-detect system preference
useEffect(() => {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  setTheme(darkModeQuery.matches ? 'dark' : 'light');

  const handler = (e: MediaQueryListEvent) => {
    setTheme(e.matches ? 'dark' : 'light');
  };

  darkModeQuery.addEventListener('change', handler);
  return () => darkModeQuery.removeEventListener('change', handler);
}, []);

// Apply theme to document
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```
```

---

## Typography Documentation

### Structure

```markdown
## Typography

### Font Families

#### Primary Font: Inter

**CSS Variable:** `--font-family-sans`

**Value:** `'Inter', system-ui, -apple-system, sans-serif`

**Purpose:** Primary typeface for all UI elements.

**Fallback Stack:**
1. `Inter` - Web font (loaded via CDN or bundled)
2. `system-ui` - System font stack
3. `-apple-system` - Apple-specific fallback
4. `sans-serif` - Generic sans-serif

**Weights Available:**
- 400 (Regular) - `--font-weight-normal`
- 500 (Medium) - `--font-weight-medium`
- 600 (Semibold) - `--font-weight-semibold`
- 700 (Bold) - `--font-weight-bold`

---

#### Monospace Font: Inter Mono

**CSS Variable:** `--font-family-mono`

**Value:** `'Inter', monospace`

**Purpose:** Code, data, numbers, and tabular content.

**Usage:**
- Code snippets and blocks
- Numeric data (currency, dates, IDs)
- Tabular data and tables
- Keyboard shortcuts

---

### Type Scale

**CSS Variables:** `--font-size-{xs,sm,base,lg,xl,2xl,3xl,4xl}`

```yaml
type-scale:
  xs:   0.75rem  (12px)  --caption, labels
  sm:   0.875rem (14px)  --small text, secondary labels
  base: 1rem     (16px)  --body text, default
  lg:   1.125rem (18px)  --emphasis, small headings
  xl:   1.25rem  (20px)  --subheadings, card titles
  2xl:  1.5rem   (24px)  --section headings, H3
  3xl:  1.875rem (30px)  --page headings, H2
  4xl:  2.25rem  (36px)  --hero headings, H1
```

**Line Heights:**
```yaml
line-height:
  tight:     1.25  --headings
  normal:    1.5   --body text
  relaxed:   1.75  --long-form content
```

**Letter Spacing:**
```yaml
letter-spacing:
  tight:     -0.025em  --large text
  normal:    0em       --default
  wide:      0.025em   --all caps
```

---

### Typography Hierarchy

```markdown
## H1 - Hero Heading

**Token:** `--font-size-4xl`

**Weight:** `--font-weight-bold`

**Line Height:** `var(--line-height-tight)`

**Usage:** Page title, main hero text.

**Example:**
```css
h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-4);
}
```

---

## H2 - Page Section

**Token:** `--font-size-3xl`

**Weight:** `--font-weight-semibold`

**Line Height:** `var(--line-height-tight)`

**Usage:** Section headings, page subtitle.

---

## H3 - Subsection

**Token:** `--font-size-2xl`

**Weight:** `--font-weight-semibold`

**Line Height:** `var(--line-height-tight)`

**Usage:** Card titles, subsections, modal headers.

---

## H4 - Card Title

**Token:** `--font-size-xl`

**Weight:** `--font-weight-semibold`

**Line Height:** `var(--line-height-tight)`

**Usage:** Widget titles, small headers.

---

## Body Text

**Token:** `--font-size-base`

**Weight:** `--font-weight-normal`

**Line Height:** `var(--line-height-normal)`

**Usage:** Paragraphs, descriptions, body content.

---

## Small Text

**Token:** `--font-size-sm`

**Weight:** `--font-weight-normal`

**Line Height:** `var(--line-height-normal)`

**Usage:** Secondary text, captions, metadata.

---

## Caption

**Token:** `--font-size-xs`

**Weight:** `--font-weight-medium`

**Line Height:** `var(--line-height-tight)`

**Usage:** Labels, tags, timestamps, helper text.
```

---

### Usage Patterns

```markdown
### Text Component Patterns

#### Headings

```typescript
function Heading({ level = 1, children, ...props }: HeadingProps) {
  const styles = {
    1: {
      fontSize: 'var(--font-size-4xl)',
      fontWeight: 'var(--font-weight-bold)',
    },
    2: {
      fontSize: 'var(--font-size-3xl)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    3: {
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    4: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    5: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    6: {
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-semibold)',
    },
  };

  return createElement(
    `h${level}`,
    {
      style: {
        ...styles[level],
        lineHeight: 'var(--line-height-tight)',
        color: 'var(--color-gray-900)',
        marginBottom: 'var(--spacing-2)',
      },
      ...props,
    },
    children
  );
}
```

#### Body Text

```typescript
function Text({ size = 'base', weight = 'normal', children, ...props }) {
  const sizeStyles = {
    xs: { fontSize: 'var(--font-size-xs)' },
    sm: { fontSize: 'var(--font-size-sm)' },
    base: { fontSize: 'var(--font-size-base)' },
    lg: { fontSize: 'var(--font-size-lg)' },
    xl: { fontSize: 'var(--font-size-xl)' },
  };

  const weightStyles = {
    normal: { fontWeight: 'var(--font-weight-normal)' },
    medium: { fontWeight: 'var(--font-weight-medium)' },
    semibold: { fontWeight: 'var(--font-weight-semibold)' },
    bold: { fontWeight: 'var(--font-weight-bold)' },
  };

  return (
    <p
      style={{
        ...sizeStyles[size],
        ...weightStyles[weight],
        lineHeight: 'var(--line-height-normal)',
        color: 'var(--color-gray-700)',
        margin: 0,
        ...props,
      }}
    >
      {children}
    </p>
  );
}
```

#### Monospace Text

```typescript
function Mono({ children, ...props }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-family-mono)',
        fontSize: 'var(--font-size-sm)',
        letterSpacing: '0.025em',
        color: 'var(--color-gray-700)',
        ...props,
      }}
    >
      {children}
    </span>
  );
}
```
```

---

## Token Documentation

### Structure

```markdown
## Design Tokens

### Spacing Scale

**System:** 8px grid-based spacing scale.

**Base Unit:** 0.25rem (4px)

**Formula:** `value * 4px`

```yaml
spacing:
  0:  0rem     (0px)   --spacing-0
  1:  0.25rem  (4px)   --spacing-1   (tight)
  2:  0.5rem   (8px)   --spacing-2   (small)
  3:  0.75rem  (12px)  --spacing-3   (medium-small)
  4:  1rem     (16px)  --spacing-4   (medium/standard)
  5:  1.25rem  (20px)  --spacing-5   (medium-large)
  6:  1.5rem   (24px)  --spacing-6   (large)
  8:  2rem     (32px)  --spacing-8   (x-large)
  10: 2.5rem   (40px)  --spacing-10  (xx-large)
  12: 3rem     (48px)  --spacing-12  (xxx-large)
  16: 4rem     (64px)  --spacing-16  (huge)
  20: 5rem     (80px)  --spacing-20  (massive)
  24: 6rem     (96px)  --spacing-24  (colossal)
```

**Usage Guidelines:**

| Context | Recommended Token | Example |
|---------|------------------|---------|
| Element padding | `--spacing-3` to `--spacing-4` | Buttons, inputs |
| Section spacing | `--spacing-6` to `--spacing-8` | Between sections |
| Container padding | `--spacing-4` to `--spacing-6` | Cards, modals |
| Gap between items | `--spacing-2` to `--spacing-4` | Flex/grid gap |
| Margin below headings | `--spacing-2` to `--spacing-3` | H1-H6 spacing |

**Component Spacing Patterns:**

```typescript
// Card component spacing
const cardSpacing = {
  padding: 'var(--spacing-6)',      // Internal padding
  marginBottom: 'var(--spacing-6)',  // Space between cards
  gap: 'var(--spacing-4)',          // Gap between children
};

// Button component spacing
const buttonSpacing = {
  padding: 'var(--spacing-3) var(--spacing-5)',  // Internal padding
  gap: 'var(--spacing-2)',                      // Space between icon and text
};

// Form field spacing
const formFieldSpacing = {
  marginBottom: 'var(--spacing-4)',  // Space between fields
  labelBottom: 'var(--spacing-2)',   // Space between label and input
  inputTop: 'var(--spacing-1)',     // Space between helper text and input
};
```

---

### Border Radius

**System:** Consistent border radius scale for rounded corners.

```yaml
radius:
  none:  0        --radius-none   (sharp corners)
  sm:    0.25rem  (4px)  --radius-sm    (small corners)
  md:    0.5rem   (8px)  --radius-md    (standard)
  lg:    0.75rem  (12px) --radius-lg    (large)
  xl:    1rem     (16px) --radius-xl    (extra large)
  2xl:   1.5rem   (24px) --radius-2xl   (2x large)
  full:  9999px   --radius-full  (pill/circle)
```

**Usage Guidelines:**

| Component | Recommended Radius |
|-----------|-------------------|
| Buttons, Inputs | `--radius-md` or `--radius-lg` |
| Cards, Modals | `--radius-lg` |
| Badges, Tags | `--radius-full` |
| Tooltips, Popovers | `--radius-md` |
| Avatars | `--radius-full` |
| Tables | `--radius-none` |

---

### Shadows

**System:** Elevation-based shadow scale for depth.

```yaml
shadows:
  sm:  "0 1px 2px 0 rgba(0, 0, 0, 0.05)"                    --shadow-sm
  base:"0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"  --shadow-base
  md:  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"  --shadow-md
  lg:  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"  --shadow-lg
  xl:  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"  --shadow-xl
```

**Usage Guidelines:**

| Context | Recommended Shadow | Example |
|---------|-------------------|---------|
| Buttons, inputs | `--shadow-sm` or none | Hover states |
| Cards | `--shadow-base` | Default card |
| Dropdowns, popovers | `--shadow-md` | Floating elements |
| Modals | `--shadow-lg` | Overlay depth |
| Tooltips | `--shadow-md` | Popover depth |
| Dragged items | `--shadow-xl` | Active elevation |

**Elevation Scale:**

```typescript
const elevationTokens = {
  level0: 'none',      // Flat, on same level
  level1: '--shadow-sm',    // Slightly raised
  level2: '--shadow-base',  // Standard raised
  level3: '--shadow-md',    // Floating
  level4: '--shadow-lg',    // Modal level
  level5: '--shadow-xl',    // Tooltip level
};

// Usage in component
function Card({ elevated = false }) {
  return (
    <div
      style={{
        boxShadow: elevated ? elevationTokens.level3 : elevationTokens.level2,
      }}
    >
      {children}
    </div>
  );
}
```

---

### Transitions

**System:** Standardized transition durations and easing.

```yaml
transitions:
  fast:  "0.1s ease"      --transition-fast   (micro-interactions)
  base:  "0.15s ease"    --transition-base   (standard)
  slow:  "0.3s ease"     --transition-slow   (deliberate)

easings:
  ease: "ease"
  ease-in: "ease-in"
  ease-out: "ease-out"
  ease-in-out: "ease-in-out"
```

**Usage Guidelines:**

| Interaction | Duration | Easing |
|-------------|-----------|--------|
| Hover states | `--transition-fast` | `ease-out` |
| Focus rings | `--transition-fast` | `ease-out` |
| Color changes | `--transition-base` | `ease` |
| Transform/scale | `--transition-base` | `ease-out` |
| Modal open/close | `--transition-slow` | `ease-in-out` |
| Page transitions | `--transition-slow` | `ease-in-out` |

**Implementation:**

```css
/* Standard interactive element transition */
.button {
  transition: background var(--transition-base) ease-out,
              color var(--transition-fast) ease,
              transform var(--transition-fast) ease-out;
}

/* Hover state */
.button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}
```

---

### Z-Index Scale

**System:** Consistent z-index values for layered elements.

```yaml
z-index:
  dropdown:    1000   --z-index-dropdown
  sticky:      1020   --z-index-sticky
  fixed:       1030   --z-index-fixed
  modal-backdrop: 1040   --z-index-modal-backdrop
  modal:       1050   --z-index-modal
  popover:     1060   --z-index-popover
  tooltip:     1070   --z-index-tooltip
```

**Usage:**

```typescript
// Layered components
const zIndices = {
  dropdown: 'var(--z-index-dropdown)',
  sticky: 'var(--z-index-sticky)',
  fixed: 'var(--z-index-fixed)',
  modalBackdrop: 'var(--z-index-modal-backdrop)',
  modal: 'var(--z-index-modal)',
  popover: 'var(--z-index-popover)',
  tooltip: 'var(--z-index-tooltip)',
};

// Modal component
function Modal({ isOpen, children }) {
  return (
    <>
      {isOpen && (
        <>
          <div style={{ zIndex: zIndices.modalBackdrop }} className="backdrop" />
          <div style={{ zIndex: zIndices.modal }} className="modal">
            {children}
          </div>
        </>
      )}
    </>
  );
}
```

---

### Component-Specific Tokens

#### Button Tokens

```yaml
button:
  height:     "2.5rem"  --button-height
  padding:    "0.5rem 1rem"  --button-padding
  font-size:  "0.875rem"  --button-font-size
  font-weight:"500"  --button-font-weight
  border-radius:"var(--radius-md)"  --button-radius
```

#### Input Tokens

```yaml
input:
  height:          "2.5rem"  --input-height
  padding:         "0.5rem 0.75rem"  --input-padding
  font-size:       "0.875rem"  --input-font-size
  border-color:    "#E2E8F0"  --input-border-color
  border-focus:    "#2D5B87"  --input-border-color-focus
  border-radius:   "var(--radius-md)"  --input-radius
```

#### Card Tokens

```yaml
card:
  padding:       "1.5rem"  --card-padding
  border-radius: "0.5rem"  --card-border-radius
  shadow:        "var(--shadow-base)"  --card-shadow
  border-color:  "var(--color-gray-200)"  --card-border-color
```

#### Badge Tokens

```yaml
badge:
  padding:       "0.25rem 0.75rem"  --badge-padding
  font-size:     "0.75rem"  --badge-font-size
  font-weight:   "500"  --badge-font-weight
  border-radius: "9999px"  --badge-border-radius
```

#### Table Tokens

```yaml
table:
  header-bg:         "#F7FAFC"  --table-header-bg
  row-hover-bg:      "#EDF2F7"  --table-row-hover-bg
  border-color:      "#E2E8F0"  --table-border-color
  cell-padding:       "0.75rem 1rem"  --table-cell-padding
  border-radius:     "var(--radius-md)"  --table-radius
```

#### Modal Tokens

```yaml
modal:
  padding:       "1.5rem"  --modal-padding
  border-radius: "0.75rem"  --modal-border-radius
  max-width:     "32rem"  --modal-max-width
  max-width-lg:  "48rem"  --modal-max-width-lg
  shadow:        "var(--shadow-xl)"  --modal-shadow
```

#### Sidebar Tokens

```yaml
sidebar:
  width:         "16rem"  --sidebar-width
  bg:            "#1E3A5F"  --sidebar-bg
  text-color:    "#F7FAFC"  --sidebar-text-color
  border-color:  "rgba(255, 255, 255, 0.1)"  --sidebar-border-color
  item-padding:  "0.75rem 1rem"  --sidebar-item-padding
  item-hover-bg: "rgba(255, 255, 255, 0.05)"  --sidebar-item-hover-bg
```

#### Header Tokens

```yaml
header:
  height:        "4rem"  --header-height
  bg:            "#FFFFFF"  --header-bg
  border-color:  "#E2E8F0"  --header-border-color
  padding:       "0 1.5rem"  --header-padding
```
```

---

## Before/After Examples

### Example 1: Color Documentation

#### ❌ Before (Poor AI Readability)

```markdown
## Colors

We use blue for primary things. The hex code is #1E3A5F. It's good for buttons.
We also have lighter blue at #2D5B87. And there's green at #48BB78 for success.
```

#### ✅ After (Optimized for AI)

```markdown
## Colors

### Primary Blue

**CSS Variable:** `--color-primary`

**Value:** `#1E3A5F`

**Purpose:** Primary brand color for main actions and branding.

**Usage:**
- Primary buttons and CTAs
- Active navigation items
- Links and interactive elements
- Page headers

**Related Tokens:**
- `--color-primary-light`: `#2D5B87` (secondary brand elements)
- `--color-primary-dark`: `#132A42` (hover states)

---

### Success

**CSS Variable:** `--color-success`

**Value:** `#48BB78`

**Purpose:** Success states, positive feedback, completed actions.

**Usage:**
- Success messages and toasts
- Completed status badges
- Positive metrics

**Token Mapping:**
```typescript
const successColors = {
  base: 'var(--color-success)',      // #48BB78
  light: 'var(--color-success-light)',  // #68D391
  dark: 'var(--color-success-dark)',    // #38A169
  bg: 'var(--status-success-bg)',       // #C6F6D5
  text: 'var(--status-success-text)',   // #22543D
};
```
```

---

### Example 2: Typography Documentation

#### ❌ Before

```markdown
## Typography

Our font is Inter. We have different sizes like 12px, 14px, 16px, etc.
Headings are bold. Body text is regular weight.
```

#### ✅ After

```markdown
## Typography

### Font Families

#### Primary Font

**CSS Variable:** `--font-family-sans`

**Value:** `'Inter', system-ui, -apple-system, sans-serif`

**Purpose:** Primary typeface for all UI elements.

---

### Type Scale

```yaml
type-scale:
  xs:   0.75rem  (12px)  --font-size-xs   --caption, labels
  sm:   0.875rem (14px)  --font-size-sm   --small text
  base: 1rem     (16px)  --font-size-base  --body text
  lg:   1.125rem (18px)  --font-size-lg   --emphasis
  xl:   1.25rem  (20px)  --font-size-xl   --subheadings
  2xl:  1.5rem   (24px)  --font-size-2xl  --section headings
  3xl:  1.875rem (30px)  --font-size-3xl  --page headings
  4xl:  2.25rem  (36px)  --font-size-4xl  --hero headings
```

**Usage:**

```typescript
// Heading component
function Heading({ level = 1, children }: HeadingProps) {
  const sizeMap = {
    1: 'var(--font-size-4xl)',
    2: 'var(--font-size-3xl)',
    3: 'var(--font-size-2xl)',
    4: 'var(--font-size-xl)',
    5: 'var(--font-size-lg)',
    6: 'var(--font-size-base)',
  };

  return (
    <h1
      style={{
        fontSize: sizeMap[level],
        fontWeight: 'var(--font-weight-bold)',
        lineHeight: 'var(--line-height-tight)',
      }}
    >
      {children}
    </h1>
  );
}
```
```

---

### Example 3: Spacing Documentation

#### ❌ Before

```markdown
## Spacing

We use an 8px grid. So spacing can be 4px, 8px, 12px, 16px, etc.
Just use rem units.
```

#### ✅ After

```markdown
## Spacing

**System:** 8px grid-based spacing scale.

**Base Unit:** 0.25rem (4px)

**Formula:** `value * 4px`

```yaml
spacing:
  0:  0rem     (0px)   --spacing-0
  1:  0.25rem  (4px)   --spacing-1
  2:  0.5rem   (8px)   --spacing-2
  3:  0.75rem  (12px)  --spacing-3
  4:  1rem     (16px)  --spacing-4
  6:  1.5rem   (24px)  --spacing-6
  8:  2rem     (32px)  --spacing-8
  12: 3rem     (48px)  --spacing-12
  16: 4rem     (64px)  --spacing-16
```

**Usage Guidelines:**

| Context | Recommended Token |
|---------|-------------------|
| Element padding | `--spacing-3` to `--spacing-4` |
| Section spacing | `--spacing-6` to `--spacing-8` |
| Container padding | `--spacing-4` to `--spacing-6` |
| Gap between items | `--spacing-2` to `--spacing-4` |

**Implementation:**

```typescript
// Spacing utility type
type SpacingToken = `--spacing-${0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16}`;

// Card with consistent spacing
function Card({ children }) {
  return (
    <div
      style={{
        padding: 'var(--spacing-6)',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)',
      }}
    >
      {children}
    </div>
  );
}
```
```

---

### Example 4: Component Documentation

#### ❌ Before

```markdown
## Button

Make a button component. It should have primary and secondary variants.
The primary one uses blue, secondary uses gray.
```

#### ✅ After

```markdown
## Component: Button

### Metadata

```json
{
  "component": "Button",
  "category": "interactive",
  "status": "stable",
  "version": "1.0.0",
  "tokens": {
    "primary": {
      "background": "--color-primary",
      "text": "--color-white",
      "hover": "--color-primary-dark"
    },
    "secondary": {
      "background": "--color-gray-100",
      "text": "--color-gray-900",
      "hover": "--color-gray-200"
    }
  }
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |

### Implementation

```typescript
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => {
    const sizeStyles = {
      sm: { padding: 'var(--spacing-2) var(--spacing-4)' },
      md: { padding: 'var(--spacing-3) var(--spacing-5)' },
      lg: { padding: 'var(--spacing-4) var(--spacing-6)' },
    };

    const variantStyles = {
      primary: {
        background: 'var(--color-primary)',
        color: 'var(--color-white)',
        border: '1px solid var(--color-primary)',
      },
      secondary: {
        background: 'var(--color-gray-100)',
        color: 'var(--color-gray-900)',
        border: '1px solid var(--color-gray-200)',
      },
    };

    return (
      <button
        ref={ref}
        style={{
          ...sizeStyles[size],
          ...variantStyles[variant],
          borderRadius: 'var(--radius-md)',
          fontWeight: 'var(--font-weight-medium)',
          fontSize: 'var(--button-font-size)',
          transition: 'var(--transition-base)',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          opacity: props.disabled ? 0.5 : 1,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Token Reference

```css
/* Primary Button */
.button--primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.button--primary:active:not(:disabled) {
  background: var(--color-primary-light);
}

.button--primary:disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

/* Secondary Button */
.button--secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
  border: 1px solid var(--color-gray-200);
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-gray-200);
}
```
```

---

## Summary Checklist

When writing brand documentation, ensure each section includes:

### ✅ Essential Elements

- [ ] **Explicit token name** (e.g., `--color-primary`)
- [ ] **Actual value** (e.g., `#1E3A5F`)
- [ ] **Purpose statement** (what it represents)
- [ ] **Usage guidelines** (when to use it)
- [ ] **Related tokens** (alternatives, variants)
- [ ] **Code examples** (implementation)
- [ ] **Accessibility notes** (contrast ratios)

### ✅ For AI Optimization

- [ ] **Structured data** (YAML/JSON tables)
- [ ] **Consistent naming** (semantic, predictable)
- [ ] **Type definitions** (TypeScript interfaces)
- [ ] **CSS variables** (direct references)
- [ ] **Code blocks with language tags**
- [ ] **Inline code for tokens**
- [ ] **Relationship mappings** (derived tokens)

### ✅ For Human Readability

- [ ] **Clear hierarchy** (headings, sections)
- [ ] **Visual examples** (swatches, samples)
- [ ] **Context and rationale** (why this exists)
- [ ] **Before/after comparisons**
- [ ] **Dos and don'ts**
- [ ] **Real-world usage examples**

---

## Resources

- [Design Tokens W3C Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Spectrum Design Tokens](https://spectrum.adobe.com/page/design-tokens/)
- [Material Design Tokens](https://m3.material.io/styles/design-tokens/overview)

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Maintainer:** Design System Team
