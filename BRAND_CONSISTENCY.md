# Brand Consistency Notes

## Overview

ATTY Financial brand has been standardized across the application. This document serves as a reference for the chosen brand palette and design decisions.

## Brand Color Palette

**Selected Palette:**
- **Primary Colors:** Black (#000000), Sand (#F6F0E4), White (#FFFFFF), Gray (#BBBBBB)
- **Secondary Colors:** Green (#86BF9E), Periwinkle (#CEDBFA), Melon (#FDE276), Yellow (#F1F698)
- **Semantic Colors:** Success (Green), Info (Periwinkle), Warning (Melon), Accent (Yellow), Error (#EF4444)

**Note:** This palette prioritizes readability and accessibility while maintaining a warm, professional financial services aesthetic.

## Typography

**Font Family:** Lato
- Used for both headings and body text
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

## Logo Assets

**Location:** `src/assets/`

**Files:**
- `logo-atty-financial-banner-dark.png` (280×90px)
- `logo-atty-financial-banner-light.png` (280×80px)
- `logo-atty-financial-stacked-dark.png` (210×210px)
- `logo-atty-financial-stacked-light.png` (210×210px)

**Naming Convention:** `logo-atty-financial-{layout}-{mode}.png`

## Implementation Status

### Completed ✅

1. **Brand Documentation Created**
   - docs/brand/README.md - Brand overview
   - docs/brand/tokens.md - Design tokens
   - docs/brand/colors.md - Color specifications
   - docs/brand/typography.md - Typography guidelines
   - docs/brand/usage.md - Implementation examples
   - docs/brand/logos.md - Logo usage guidelines
   - docs/brand/font-loading.md - Font loading strategy

2. **TypeScript Tokens Created**
   - src/tokens/colors.ts - Color tokens with types
   - src/tokens/typography.ts - Typography tokens
   - src/tokens/index.ts - Central export point

3. **CSS Variables Defined**
   - src/styles/theme.css - All design tokens as CSS custom properties
   - src/styles/fonts.css - Dedicated font loading
   - src/styles/globals.css - Global styles updated

4. **Font Loading Optimized**
   - Google Fonts Lato import with display=swap
   - Preconnect hints in index.html
   - Proper fallback font stack

5. **Components Updated to Use Design Tokens**
   - src/components/ui/Button.tsx - Uses CSS variables
   - src/components/ui/Badge.tsx - Uses CSS variables
   - src/components/ui/Card.tsx - Uses CSS variables
   - src/components/layout/Header.tsx - Uses CSS variables and actual logo

6. **Constants Updated**
   - src/utils/constants.ts - Updated BRAND_COLORS and TYPOGRAPHY

7. **Logo Files Fixed**
   - Corrected filename typo: logo-atty-financil → logo-atty-financial
   - All 4 logo variants available

8. **Documentation Updated**
   - README.md - Added logo quick reference
   - docs/brand/README.md - Added logo section

## Design Token Usage

### CSS Custom Properties

All brand values are available as CSS custom properties:

```css
/* Colors */
--color-primary-black: #000000;
--color-primary-sand: #F6F0E4;
--color-primary-white: #FFFFFF;
--color-primary-gray: #BBBBBB;
--color-secondary-green: #86BF9E;
--color-secondary-periwinkle: #CEDBFA;
--color-secondary-melon: #FDE276;
--color-secondary-yellow: #F1F698;

/* Typography */
--font-family-base: 'Lato', sans-serif;
--font-family-heading: 'Lato', sans-serif;
--font-size-base: 1rem;
--font-weight-medium: 500;
--line-height-relaxed: 1.625;

/* Spacing */
--spacing-4: 1rem;
--spacing-6: 1.5rem;

/* Borders */
--radius-lg: 0.5rem;
--radius-md: 0.375rem;

/* Shadows */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### TypeScript Tokens

```typescript
import {
  primaryColors,
  secondaryColors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from '@/tokens';

// Usage
const buttonStyle = {
  backgroundColor: primaryColors.black.hex,
  color: primaryColors.white.hex,
  padding: spacing[4],
  borderRadius: borderRadius.lg,
};
```

## Component Migration

### Before
```tsx
// Button - Used hardcoded classes
const Button = () => (
  <button className="bg-primary text-white hover:bg-primary-dark">
    Click
  </button>
);
```

### After
```tsx
// Button - Uses CSS variables
const Button = () => (
  <button
    style={{
      backgroundColor: 'var(--bg-primary-black)',
      color: 'var(--text-primary-white)',
    }}
  >
    Click
  </button>
);
```

## Brand Verification

A brand verification script is available to check for hardcoded values:

```bash
# Run verification
npm run verify:brand

# Auto-fix violations
npm run verify:brand:fix

# Generate report
npm run verify:brand:report
```

See: [scripts/README.md](../scripts/README.md) for details.

## Guidelines for Developers

### DO ✅

1. **Use CSS Variables** for all brand values
   ```css
   color: var(--color-primary-black);
   font-family: var(--font-family-base);
   ```

2. **Use TypeScript Tokens** when possible
   ```typescript
   import { colors } from '@/tokens';
   const black = colors.primaryBlack.hex;
   ```

3. **Follow File Naming Convention** for logos
   ```
   logo-atty-financial-{layout}-{mode}.png
   ```

4. **Use Appropriate Logo Variant** based on background
   - Dark backgrounds → Dark logo
   - Light backgrounds → Light logo

5. **Maintain Clearance** around logos (16px minimum)
6. **Provide Descriptive Alt Text** for accessibility
7. **Test on Light and Dark** backgrounds
8. **Check Contrast Ratios** (4.5:1 minimum for normal text)

### DON'T ❌

1. **Don't Hardcode Brand Colors**
   ```css
   /* Bad */
   color: #000000;

   /* Good */
   color: var(--color-primary-black);
   ```

2. **Don't Use Wrong Font**
   ```css
   /* Bad - Inter is legacy */
   font-family: 'Inter', sans-serif;

   /* Good */
   font-family: var(--font-family-base);
   ```

3. **Don't Mix Dark/Light Logos Incorrectly**
4. **Don't Remove Alt Text** from logos
5. **Don't Stretch Logos** - maintain aspect ratio
6. **Don't Add Effects** to logos (shadows, filters)

## Color Mode Selection

### Dark Mode Logos
Use when background is:
- Black (#000000)
- Dark Gray (#1a1a1a, #333333)
- Any background where logo is lightest element

### Light Mode Logos
Use when background is:
- White (#FFFFFF)
- Sand (#F6F0E4)
- Light Gray (#F7FAFC, #EDF2F7)
- Any background where logo is darkest element

## Resources

- [Brand Documentation](./docs/brand/README.md) - Complete brand guide
- [Design Tokens](./docs/brand/tokens.md) - Token reference
- [Color Specifications](./docs/brand/colors.md) - Color details
- [Typography Guidelines](./docs/brand/typography.md) - Typography specs
- [Logo Guidelines](./docs/brand/logos.md) - Logo usage
- [Font Loading Strategy](./docs/brand/font-loading.md) - Font optimization
- [Implementation Guide](./docs/brand/usage.md) - Code examples

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-05 | Initial brand consistency implementation |

## Notes

- All brand values follow ATTY Financial brand guidelines
- Design system is consistent across the application
- Components use CSS custom properties for maintainability
- TypeScript tokens provide type safety for developers
- Logo assets follow proper naming convention
- Font loading is optimized for performance
- Accessibility is maintained throughout (WCAG AA compliant)

## Support

For questions or issues with brand implementation, refer to:
- Brand documentation in docs/brand/
- Component examples in docs/brand/usage.md
- Brand verification script: scripts/verify-brand-tokens.ts
