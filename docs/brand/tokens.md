# Design Tokens Reference

Complete design token system for Atty Financial. These tokens are structured for machine readability and can be used directly in CSS, TypeScript, and component systems.

## Token Structure

All tokens follow this naming pattern:
```
--{category}-{type}-{variant}-{state}
```

## Color Tokens

### Primary Colors

```css
:root {
  /* Black - Primary text and CTAs */
  --color-primary-black: #000000;
  --color-primary-black-rgb: 0, 0, 0;
  --color-primary-black-hover: #1a1a1a;
  --color-primary-black-active: #333333;

  /* Sand - Backgrounds */
  --color-primary-sand: #F6F0E4;
  --color-primary-sand-rgb: 246, 240, 228;
  --color-primary-sand-dark: #E8E2D6;
  --color-primary-sand-light: #FAF7F0;

  /* White - Cards and highlights */
  --color-primary-white: #FFFFFF;
  --color-primary-white-rgb: 255, 255, 255;
  --color-primary-white-off: #F8F8F8;

  /* Gray - Borders and muted text */
  --color-primary-gray: #BBBBBB;
  --color-primary-gray-rgb: 187, 187, 187;
  --color-primary-gray-light: #E5E5E5;
  --color-primary-gray-dark: #999999;
}
```

### Secondary Colors

```css
:root {
  /* Green - Success states */
  --color-secondary-green: #86BF9E;
  --color-secondary-green-rgb: 134, 191, 158;
  --color-secondary-green-hover: #76AD8E;
  --color-secondary-green-light: #A8D4B6;
  --color-secondary-green-bg: #E8F5ED;

  /* Periwinkle - Info states */
  --color-secondary-periwinkle: #CEDBFA;
  --color-secondary-periwinkle-rgb: 206, 219, 250;
  --color-secondary-periwinkle-hover: #BEC9E8;
  --color-secondary-periwinkle-light: #E3E9FC;
  --color-secondary-periwinkle-bg: #F0F4FF;

  /* Melon - Warnings */
  --color-secondary-melon: #FDE276;
  --color-secondary-melon-rgb: 253, 226, 118;
  --color-secondary-melon-hover: #EDD466;
  --color-secondary-melon-light: #FEEB9E;
  --color-secondary-melon-bg: #FEF8E8;

  /* Yellow - Callouts */
  --color-secondary-yellow: #F1F698;
  --color-secondary-yellow-rgb: 241, 246, 152;
  --color-secondary-yellow-hover: #E1E688;
  --color-secondary-yellow-light: #F7FAB8;
  --color-secondary-yellow-bg: #FBFDE8;
}
```

### Semantic Colors

```css
:root {
  /* Semantic mappings */
  --color-success: var(--color-secondary-green);
  --color-success-light: var(--color-secondary-green-light);
  --color-success-bg: var(--color-secondary-green-bg);

  --color-info: var(--color-secondary-periwinkle);
  --color-info-light: var(--color-secondary-periwinkle-light);
  --color-info-bg: var(--color-secondary-periwinkle-bg);

  --color-warning: var(--color-secondary-melon);
  --color-warning-light: var(--color-secondary-melon-light);
  --color-warning-bg: var(--color-secondary-melon-bg);

  --color-accent: var(--color-secondary-yellow);
  --color-accent-light: var(--color-secondary-yellow-light);
  --color-accent-bg: var(--color-secondary-yellow-bg);
}
```

## Typography Tokens

### Font Family

```css
:root {
  --font-family-base: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --font-family-heading: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}
```

### Font Sizes

```css
:root {
  /* Type scale - Major Third (1.25) */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */
}
```

### Font Weights

```css
:root {
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Line Heights

```css
:root {
  --line-height-tight: 1.2;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;
}
```

### Letter Spacing

```css
:root {
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
}
```

## Spacing Tokens

```css
:root {
  /* 4px base unit */
  --spacing-0: 0;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */
  --spacing-20: 5rem;    /* 80px */
  --spacing-24: 6rem;    /* 96px */
}
```

## Border Radius Tokens

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;
}
```

## Shadow Tokens

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}
```

## Z-Index Tokens

```css
:root {
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
}
```

## Transition Tokens

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

## TypeScript Type Definitions

```typescript
// brand-tokens.ts

export type ColorToken =
  | 'primary-black'
  | 'primary-sand'
  | 'primary-white'
  | 'primary-gray'
  | 'secondary-green'
  | 'secondary-periwinkle'
  | 'secondary-melon'
  | 'secondary-yellow';

export type FontSizeToken =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl';

export type FontWeightToken =
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold';

export type SpacingToken =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24';

export type BorderRadiusToken =
  | 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface DesignTokens {
  colors: {
    [K in ColorToken]: string;
  };
  fontSizes: {
    [K in FontSizeToken]: string;
  };
  fontWeights: {
    [K in FontWeightToken]: number;
  };
  spacing: {
    [K in SpacingToken]: string;
  };
  borderRadius: {
    [K in BorderRadiusToken]: string;
  };
}

export const tokens: DesignTokens = {
  colors: {
    'primary-black': '#000000',
    'primary-sand': '#F6F0E4',
    'primary-white': '#FFFFFF',
    'primary-gray': '#BBBBBB',
    'secondary-green': '#86BF9E',
    'secondary-periwinkle': '#CEDBFA',
    'secondary-melon': '#FDE276',
    'secondary-yellow': '#F1F698',
  },
  fontSizes: {
    'xs': '0.75rem',
    'sm': '0.875rem',
    'base': '1rem',
    'lg': '1.125rem',
    'xl': '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeights: {
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
  },
  spacing: {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
  },
  borderRadius: {
    'none': '0',
    'sm': '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    'full': '9999px',
  },
};

// Helper function to get CSS variable value
export function getToken(category: string, name: string): string {
  return `var(--${category}-${name})`;
}

// Example: getToken('color', 'primary-black') → 'var(--color-primary-black)'
```

## Tailwind Integration Example

```javascript
// tailwind.config.js
module.exports = {
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
      spacing: {
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
    },
  },
};
```

## Token Usage Guidelines

1. **Always use CSS custom properties** rather than hardcoding values
2. **Reference tokens by their full name** for clarity in code reviews
3. **Use semantic color tokens** for states (success, info, warning) instead of raw colors
4. **Maintain token hierarchy** - use semantic tokens where available
5. **Document custom tokens** if you need to extend the system
