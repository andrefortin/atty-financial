# Typography Specifications

Complete typography guidelines for Atty Financial brand, including font specifications, type scale, loading instructions, and component-specific usage.

## Font Family

### Primary Font: Lato

| Property | Value |
|----------|-------|
| Font Family | Lato |
| Designer | Łukasz Dziedzic |
| Category | Sans-serif |
| Weights Available | 300 (Light), 400 (Regular), 700 (Bold) |
| Recommended Weights | 400, 500, 600, 700 |
| License | SIL Open Font License (OFL) |

**Note:** While Lato has weights 300-900 available, Atty Financial uses a simplified weight range of 400-700 for optimal performance and consistency.

### Font Loading

#### Google Fonts (Recommended)

```html
<!-- Add to <head> of your HTML document -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### Self-Hosted (For Production)

```css
/* Add to your CSS */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/lato-regular.woff2') format('woff2'),
       url('/fonts/lato-regular.woff') format('woff');
}

@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/lato-medium.woff2') format('woff2'),
       url('/fonts/lato-medium.woff') format('woff');
}

@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/lato-semibold.woff2') format('woff2'),
       url('/fonts/lato-semibold.woff') format('woff');
}

@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/lato-bold.woff2') format('woff2'),
       url('/fonts/lato-bold.woff') format('woff');
}
```

### Font Stack

```css
/* Fallback font stack */
--font-family-base: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
--font-family-heading: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

**Fallback Priority:**
1. Lato (primary)
2. System fonts (San Francisco on Mac, Segoe UI on Windows, Roboto on Android)
3. Generic sans-serif

## Type Scale

The type scale follows a Major Third (1.25) ratio for harmonious sizing across all breakpoints.

### Size Table

| Token Name | Size | rem | px | Line Height | Usage |
|------------|------|-----|----|-------------|-------|
| `--font-size-xs` | Extra Small | 0.75rem | 12px | 1.5 (18px) | Captions, labels |
| `--font-size-sm` | Small | 0.875rem | 14px | 1.5 (21px) | Small text, helpers |
| `--font-size-base` | Base | 1rem | 16px | 1.6 (26px) | Body text |
| `--font-size-lg` | Large | 1.125rem | 18px | 1.5 (27px) | Lead text, emphasized |
| `--font-size-xl` | Extra Large | 1.25rem | 20px | 1.4 (28px) | Subheadings |
| `--font-size-2xl` | 2X Large | 1.5rem | 24px | 1.3 (31px) | Section headings |
| `--font-size-3xl` | 3X Large | 1.875rem | 30px | 1.25 (38px) | Page headings |
| `--font-size-4xl` | 4X Large | 2.25rem | 36px | 1.2 (43px) | Hero headings |
| `--font-size-5xl` | 5X Large | 3rem | 48px | 1.15 (55px) | Display headings |

### CSS Variables

```css
:root {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
}
```

## Font Weights

| Weight Name | Value | CSS Property | Usage |
|-------------|-------|--------------|-------|
| Regular | 400 | `font-weight: 400` | Body text, standard paragraphs |
| Medium | 500 | `font-weight: 500` | Labels, buttons, emphasized text |
| Semibold | 600 | `font-weight: 600` | Subheadings, UI elements |
| Bold | 700 | `font-weight: 700` | Headlines, strong emphasis |

### CSS Variables

```css
:root {
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

## Line Heights

| Token Name | Value | Decimal | Usage |
|------------|-------|---------|-------|
| `--line-height-tight` | 1.2 | 1.2 | Large headings |
| `--line-height-snug` | 1.375 | 1.375 | Headings, subheadings |
| `--line-height-normal` | 1.5 | 1.5 | Most text, UI elements |
| `--line-height-relaxed` | 1.625 | 1.625 | Body text, long form |
| `--line-height-loose` | 2 | 2.0 | Very loose spacing |

### CSS Variables

```css
:root {
  --line-height-tight: 1.2;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;
}
```

## Letter Spacing

| Token Name | Value | em | Usage |
|------------|-------|----|-------|
| `--letter-spacing-tighter` | -0.05em | -0.05 | Large headings |
| `--letter-spacing-tight` | -0.025em | -0.025 | Headings |
| `--letter-spacing-normal` | 0 | 0 | Body text, normal |
| `--letter-spacing-wide` | 0.025em | 0.025 | Uppercase text |
| `--letter-spacing-wider` | 0.05em | 0.05 | Buttons, labels |

### CSS Variables

```css
:root {
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
}
```

## Component-Specific Typography

### Headlines

```css
/* H1 - Page Title */
h1, .heading-1 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--color-primary-black);
}

/* H2 - Section Title */
h2, .heading-2 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--color-primary-black);
}

/* H3 - Subsection Title */
h3, .heading-3 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}

/* H4 - Component Title */
h4, .heading-4 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}
```

### Body Text

```css
/* Body - Standard */
.body, p {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}

/* Body - Large (Lead) */
.body-large, .lead {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}

/* Body - Small */
.body-small, small {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}
```

### Labels and UI Elements

```css
/* Label - Form Labels */
.label, label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
}

/* Caption - Helper Text */
.caption {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-gray);
}

/* Button Text */
.button-text {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: none;
}

/* Link */
.link, a {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: var(--color-primary-black);
  text-decoration: underline;
}
```

### Navigation

```css
/* Nav Link */
.nav-link {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-primary-black);
  text-transform: uppercase;
}

/* Breadcrumb */
.breadcrumb {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-primary-gray);
  text-transform: uppercase;
}
```

## Responsive Typography

### Mobile-First Approach

```css
/* Base (Mobile) */
h1 { font-size: var(--font-size-3xl); }  /* 30px */
h2 { font-size: var(--font-size-2xl); }  /* 24px */
h3 { font-size: var(--font-size-xl); }   /* 20px */

/* Tablet (768px+) */
@media (min-width: 768px) {
  h1 { font-size: var(--font-size-4xl); }  /* 36px */
  h2 { font-size: var(--font-size-3xl); }  /* 30px */
  h3 { font-size: var(--font-size-2xl); }  /* 24px */
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  h1 { font-size: var(--font-size-5xl); }  /* 48px */
  h2 { font-size: var(--font-size-4xl); }  /* 36px */
  h3 { font-size: var(--font-size-3xl); }  /* 30px */
}
```

## Text Alignment and Spacing

### Alignment

```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
```

### Text Transform

```css
.text-uppercase { text-transform: uppercase; }
.text-lowercase { text-transform: lowercase; }
.text-capitalize { text-transform: capitalize; }
```

### Text Decoration

```css
.text-underline { text-decoration: underline; }
.text-no-underline { text-decoration: none; }
.text-line-through { text-decoration: line-through; }
```

## Typography Tokens

### Complete Token Set

```css
:root {
  /* Font Family */
  --font-family-base: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --font-family-heading: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;

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
  --line-height-loose: 2;

  /* Letter Spacing */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
}
```

## Usage Guidelines

### Do's

✓ Use Lato for all headlines and body text
✓ Maintain consistent font weights (400, 500, 600, 700)
✓ Use appropriate line heights for readability
✓ Keep letter spacing subtle (-0.05em to 0.05em)
✓ Ensure adequate contrast for all text
✓ Test typography on actual devices
✓ Use responsive scaling for different screen sizes

### Don'ts

✗ Use other font families without approval
✗ Use font weights outside 400-700 range
✗ Set line heights too tight or too loose
✗ Use excessive letter spacing
✗ Use light gray text on light backgrounds
✗ Mix too many font sizes in one layout
✗ Use uppercase for long text passages

## Typography in Code

### React Component Example

```tsx
import { tokens } from './brand-tokens';

type HeadingProps = {
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
};

export function Heading({ level, children }: HeadingProps) {
  const styles = {
    1: {
      fontSize: tokens.fontSizes['4xl'],
      fontWeight: tokens.fontWeights.bold,
      lineHeight: tokens.lineHeights.tight,
    },
    2: {
      fontSize: tokens.fontSizes['3xl'],
      fontWeight: tokens.fontWeights.bold,
      lineHeight: tokens.lineHeights.tight,
    },
    3: {
      fontSize: tokens.fontSizes['2xl'],
      fontWeight: tokens.fontWeights.semibold,
      lineHeight: tokens.lineHeights.snug,
    },
    4: {
      fontSize: tokens.fontSizes.xl,
      fontWeight: tokens.fontWeights.semibold,
      lineHeight: tokens.lineHeights.snug,
    },
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag style={styles[level]}>{children}</Tag>
  );
}
```

### Tailwind Integration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-family-base)'],
        heading: ['var(--font-family-heading)'],
      },
      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
        sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-relaxed)' }],
        lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
        xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-snug)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-snug)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
      },
    },
  },
};
```

## Font Performance Optimization

### Best Practices

1. **Use `font-display: swap`** to show text immediately with fallback font
2. **Preconnect to font CDN** to speed up connection
3. **Load only necessary weights** (400, 500, 600, 700)
4. **Use WOFF2 format** (smaller file size, better compression)
5. **Consider self-hosting** for production to reduce external dependencies
6. **Subset fonts** if only using Latin characters

### Font Loading Strategy

```html
<!-- Optimized loading -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap"
  rel="stylesheet"
  media="print" onload="this.media='all'"
>
<noscript>
  <link
    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  >
</noscript>
```
