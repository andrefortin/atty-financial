# Implementation Guidelines

Complete implementation examples showing how to use Atty Financial brand tokens in React, CSS, and TypeScript projects.

## Quick Start

### 1. Import CSS Variables

Add the design tokens to your global CSS file:

```css
/* globals.css or index.css */
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap');

:root {
  /* Colors - Primary */
  --color-primary-black: #000000;
  --color-primary-sand: #F6F0E4;
  --color-primary-white: #FFFFFF;
  --color-primary-gray: #BBBBBB;

  /* Colors - Secondary */
  --color-secondary-green: #86BF9E;
  --color-secondary-periwinkle: #CEDBFA;
  --color-secondary-melon: #FDE276;
  --color-secondary-yellow: #F1F698;

  /* Typography */
  --font-family-base: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-heading: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Font Sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-primary-black);
  background-color: var(--color-primary-sand);
}
```

## React Implementation

### Using CSS Variables with Inline Styles

```tsx
import React from 'react';

export function Card({ title, description, children }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-primary-white)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-6)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 'var(--line-height-snug)',
          marginBottom: 'var(--spacing-3)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-family-base)',
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-relaxed)',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        {description}
      </p>
      {children}
    </div>
  );
}
```

### Using Styled Components

```tsx
import styled from 'styled-components';

const StyledCard = styled.div`
  background-color: var(--color-primary-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);

  h2 {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-snug);
    margin-bottom: var(--spacing-3);
    color: var(--color-primary-black);
  }

  p {
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-4);
    color: var(--color-primary-black);
  }
`;

export function Card({ title, description, children }: CardProps) {
  return (
    <StyledCard>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </StyledCard>
  );
}
```

### Creating Reusable Typography Components

```tsx
import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

const headingStyles = {
  1: {
    fontSize: 'var(--font-size-4xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-tight)',
  },
  2: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-tight)',
  },
  3: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--line-height-snug)',
  },
  4: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: 'var(--line-height-snug)',
  },
  5: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--line-height-normal)',
  },
  6: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--line-height-normal)',
  },
};

export function Heading({ level, children, className }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const style = {
    fontFamily: 'var(--font-family-heading)',
    color: 'var(--color-primary-black)',
    ...headingStyles[level],
  };

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}

interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'lg';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
}

export function Text({ size = 'base', weight = 'regular', children, className }: TextProps) {
  const sizeStyles = {
    xs: { fontSize: 'var(--font-size-xs)' },
    sm: { fontSize: 'var(--font-size-sm)' },
    base: { fontSize: 'var(--font-size-base)' },
    lg: { fontSize: 'var(--font-size-lg)' },
  };

  const weightStyles = {
    regular: { fontWeight: 'var(--font-weight-regular)' },
    medium: { fontWeight: 'var(--font-weight-medium)' },
    semibold: { fontWeight: 'var(--font-weight-semibold)' },
    bold: { fontWeight: 'var(--font-weight-bold)' },
  };

  return (
    <p
      className={className}
      style={{
        fontFamily: 'var(--font-family-base)',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--color-primary-black)',
        ...sizeStyles[size],
        ...weightStyles[weight],
      }}
    >
      {children}
    </p>
  );
}
```

### Button Component with Brand Colors

```tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline';

interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const buttonStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary-black)',
    color: 'var(--color-primary-white)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--color-primary-white)',
    color: 'var(--color-primary-black)',
    border: '2px solid var(--color-primary-black)',
  },
  success: {
    backgroundColor: 'var(--color-secondary-green)',
    color: 'var(--color-primary-black)',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary-black)',
    border: '2px solid var(--color-primary-gray)',
  },
};

const buttonHoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#1a1a1a',
  },
  secondary: {
    backgroundColor: 'var(--color-primary-white-off)',
  },
  success: {
    backgroundColor: 'var(--color-secondary-green-hover)',
  },
  outline: {
    borderColor: 'var(--color-primary-black)',
  },
};

export function Button({ variant = 'primary', children, onClick, disabled, className }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    padding: 'var(--spacing-3) var(--spacing-6)',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    opacity: disabled ? 0.5 : 1,
    ...buttonStyles[variant],
  };

  return (
    <button
      className={className}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, buttonHoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, buttonStyles[variant]);
      }}
    >
      {children}
    </button>
  );
}
```

## CSS Implementation

### Utility Classes Pattern

```css
/* utils.css */

/* Colors */
.text-primary-black { color: var(--color-primary-black); }
.text-primary-gray { color: var(--color-primary-gray); }
.text-secondary-green { color: var(--color-secondary-green); }

.bg-primary-sand { background-color: var(--color-primary-sand); }
.bg-primary-white { background-color: var(--color-primary-white); }
.bg-secondary-green { background-color: var(--color-secondary-green); }

/* Typography */
.font-heading { font-family: var(--font-family-heading); }
.font-base { font-family: var(--font-family-base); }

.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }

.font-regular { font-weight: var(--font-weight-regular); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

/* Spacing */
.p-1 { padding: var(--spacing-1); }
.p-2 { padding: var(--spacing-2); }
.p-4 { padding: var(--spacing-4); }
.p-6 { padding: var(--spacing-6); }
.p-8 { padding: var(--spacing-8); }

.m-1 { margin: var(--spacing-1); }
.m-2 { margin: var(--spacing-2); }
.m-4 { margin: var(--spacing-4); }
.m-6 { margin: var(--spacing-6); }

.mt-4 { margin-top: var(--spacing-4); }
.mb-4 { margin-bottom: var(--spacing-4); }
.mt-6 { margin-top: var(--spacing-6); }
.mb-6 { margin-bottom: var(--spacing-6); }

/* Borders & Radius */
.border { border: 1px solid var(--color-primary-gray); }
.border-radius-sm { border-radius: var(--radius-sm); }
.border-radius-md { border-radius: var(--radius-md); }
.border-radius-lg { border-radius: var(--radius-lg); }

/* Shadows */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
```

### Using Utility Classes

```html
<div class="bg-primary-white p-6 border-radius-lg shadow-md">
  <h2 class="font-heading text-2xl font-semibold leading-tight mb-4">
    Section Heading
  </h2>
  <p class="font-base text-base leading-relaxed">
    This is body text using the brand typography system.
  </p>
  <button class="font-base font-medium bg-primary-black text-primary-white p-2 border-radius-md">
    Call to Action
  </button>
</div>
```

### Component-Specific CSS

```css
/* card.css */
.card {
  background-color: var(--color-primary-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.card__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-primary-black);
  margin-bottom: var(--spacing-3);
}

.card__description {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-primary-black);
  margin-bottom: var(--spacing-4);
}

.card__footer {
  display: flex;
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-primary-gray);
}
```

## TypeScript Implementation

### Typed Token Access

```typescript
// tokens.ts
export const tokens = {
  colors: {
    primaryBlack: 'var(--color-primary-black)',
    primarySand: 'var(--color-primary-sand)',
    primaryWhite: 'var(--color-primary-white)',
    primaryGray: 'var(--color-primary-gray)',
    secondaryGreen: 'var(--color-secondary-green)',
    secondaryPeriwinkle: 'var(--color-secondary-periwinkle)',
    secondaryMelon: 'var(--color-secondary-melon)',
    secondaryYellow: 'var(--color-secondary-yellow)',
  },
  fontSizes: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
  },
  fontWeights: {
    regular: 'var(--font-weight-regular)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
  lineHeights: {
    tight: 'var(--line-height-tight)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
  },
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    12: 'var(--spacing-12)',
  },
  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  },
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
} as const;

export type TokenKey = typeof tokens;
export type ColorToken = keyof TokenKey['colors'];
export type FontSizeToken = keyof TokenKey['fontSizes'];
export type FontWeightToken = keyof TokenKey['fontWeights'];
export type SpacingToken = keyof TokenKey['spacing'];
export type BorderRadiusToken = keyof TokenKey['borderRadius'];
```

### Typed Style Object

```typescript
// styles.ts
import { tokens } from './tokens';

export interface CardStyle {
  container: React.CSSProperties;
  title: React.CSSProperties;
  description: React.CSSProperties;
}

export const cardStyles: CardStyle = {
  container: {
    backgroundColor: tokens.colors.primaryWhite,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[6],
    boxShadow: tokens.shadows.md,
  },
  title: {
    fontFamily: 'var(--font-family-heading)',
    fontSize: tokens.fontSizes['2xl'],
    fontWeight: tokens.fontWeights.semibold,
    lineHeight: tokens.lineHeights.tight,
    color: tokens.colors.primaryBlack,
    marginBottom: tokens.spacing[3],
  },
  description: {
    fontFamily: 'var(--font-family-base)',
    fontSize: tokens.fontSizes.base,
    lineHeight: tokens.lineHeights.relaxed,
    color: tokens.colors.primaryBlack,
    marginBottom: tokens.spacing[4],
  },
};
```

## Tailwind CSS Integration

### Configure Tailwind Theme

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          black: 'var(--color-primary-black)',
          sand: 'var(--color-primary-sand)',
          white: 'var(--color-primary-white)',
          gray: 'var(--color-primary-gray)',
        },
        secondary: {
          green: 'var(--color-secondary-green)',
          periwinkle: 'var(--color-secondary-periwinkle)',
          melon: 'var(--color-secondary-melon)',
          yellow: 'var(--color-secondary-yellow)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-base)'],
        heading: ['var(--font-family-heading)'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
      },
      fontWeight: {
        regular: 'var(--font-weight-regular)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
      },
      spacing: {
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '12': 'var(--spacing-12)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
```

### Using Tailwind with Brand Tokens

```tsx
import React from 'react';

export function Card({ title, description }: CardProps) {
  return (
    <div className="bg-primary-white rounded-lg p-6 shadow-md">
      <h2 className="font-heading text-2xl font-semibold leading-tight mb-3">
        {title}
      </h2>
      <p className="font-sans text-base leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex gap-3 pt-4 border-t border-primary-gray">
        <button className="bg-primary-black text-white px-6 py-2 rounded-md font-medium">
          Primary Action
        </button>
        <button className="bg-white text-black border-2 border-black px-6 py-2 rounded-md font-medium">
          Secondary
        </button>
      </div>
    </div>
  );
}
```

## Common Patterns

### Alert/Message Component

```tsx
type AlertVariant = 'success' | 'info' | 'warning';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
}

const alertStyles: Record<AlertVariant, { bg: string; icon: string }> = {
  success: {
    bg: 'var(--color-secondary-green-bg)',
    icon: '✓',
  },
  info: {
    bg: 'var(--color-secondary-periwinkle-bg)',
    icon: 'ℹ',
  },
  warning: {
    bg: 'var(--color-secondary-melon-bg)',
    icon: '⚠',
  },
};

export function Alert({ variant, title, children }: AlertProps) {
  const style = alertStyles[variant];

  return (
    <div
      style={{
        backgroundColor: style.bg,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-4)',
        borderLeft: `4px solid var(--color-secondary-${variant})`,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-2)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          <span>{style.icon}</span>
          <span>{title}</span>
        </div>
      )}
      <p
        style={{
          fontFamily: 'var(--font-family-base)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-normal)',
          marginLeft: title ? 'calc(1em + var(--spacing-2))' : 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
```

### Badge/Tag Component

```tsx
type BadgeVariant = 'success' | 'info' | 'warning' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    backgroundColor: 'var(--color-secondary-green-bg)',
    color: 'var(--color-primary-black)',
    border: `1px solid var(--color-secondary-green)`,
  },
  info: {
    backgroundColor: 'var(--color-secondary-periwinkle-bg)',
    color: 'var(--color-primary-black)',
    border: `1px solid var(--color-secondary-periwinkle)`,
  },
  warning: {
    backgroundColor: 'var(--color-secondary-melon-bg)',
    color: 'var(--color-primary-black)',
    border: `1px solid var(--color-secondary-melon)`,
  },
  default: {
    backgroundColor: 'var(--color-primary-sand)',
    color: 'var(--color-primary-black)',
    border: `1px solid var(--color-primary-gray)`,
  },
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-family-base)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        padding: 'var(--spacing-1) var(--spacing-2)',
        borderRadius: 'var(--radius-sm)',
        ...badgeStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
```

## Best Practices

### 1. Always Use CSS Variables

```css
/* ❌ Don't hardcode values */
.button {
  background-color: #000000;
  padding: 16px;
}

/* ✅ Use CSS variables */
.button {
  background-color: var(--color-primary-black);
  padding: var(--spacing-4);
}
```

### 2. Maintain Semantic Color Usage

```tsx
// ❌ Don't use semantic names for non-semantic purposes
<div style={{ color: 'var(--color-secondary-green)' }}>
  This is not a success message
</div>

// ✅ Use semantic colors appropriately
<Alert variant="success">Operation completed!</Alert>
```

### 3. Ensure Accessibility

```tsx
// ✅ Always include focus states
<button
  style={{
    outline: 'none',
  }}
  onFocus={(e) => {
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-secondary-periwinkle)';
  }}
  onBlur={(e) => {
    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
  }}
>
  Click me
</button>
```

### 4. Test Across Devices

```tsx
// ✅ Use responsive typography
<h2
  style={{
    fontSize: 'clamp(var(--font-size-2xl), 5vw, var(--font-size-3xl))',
  }}
>
  Responsive Heading
</h2>
```

## Migration Checklist

When implementing the brand system:

- [ ] Import global CSS variables in your main stylesheet
- [ ] Update Tailwind config to use CSS custom properties
- [ ] Replace hardcoded colors with token variables
- [ ] Update font imports to use Lato
- [ ] Replace existing font sizes with type scale tokens
- [ ] Update spacing to use spacing tokens
- [ ] Test color contrast ratios
- [ ] Verify focus states are visible
- [ ] Check responsive typography
- [ ] Update any custom components to use brand tokens
