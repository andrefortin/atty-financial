# Atty Financial Brand Documentation

Complete brand guidelines and implementation resources for Atty Financial's digital presence. This documentation is designed for both human designers/developers and AI agents working with the brand system.

## Quick Reference

### Brand Colors

| Category | Color Name | Hex | RGB | Usage |
|----------|------------|-----|-----|-------|
| Primary | Black | `#000000` | `0, 0, 0` | Text, primary CTAs, anchors |
| Primary | Sand | `#F6F0E4` | `246, 240, 228` | Backgrounds, soft sections |
| Primary | White | `#FFFFFF` | `255, 255, 255` | Card backgrounds, highlights |
| Primary | Gray | `#BBBBBB` | `187, 187, 187` | Borders, dividers, muted text |
| Secondary | Green | `#86BF9E` | `134, 191, 158` | Success states, accents |
| Secondary | Periwinkle | `#CEDBFA` | `206, 219, 250` | Info states, soft accents |
| Secondary | Melon | `#FDE276` | `253, 226, 118` | Warnings, highlights |
| Secondary | Yellow | `#F1F698` | `241, 246, 152` | Callouts, decorative |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Headlines | Lato | 700 (Bold) | 32-48px | 1.2 |
| Subheadlines | Lato | 600 (SemiBold) | 20-24px | 1.3 |
| Body Text | Lato | 400 (Regular) | 16px | 1.6 |
| Small Text | Lato | 400 (Regular) | 14px | 1.5 |
| Labels | Lato | 500 (Medium) | 12-14px | 1.4 |

### Logos

| Variant | File | Dimensions | Mode | Usage |
|---------|------|------------|------|-------|
| Banner (Horizontal) | `logo-atty-financial-banner-dark.png` | 280×90px | Dark | Headers, navigation, email signatures |
| Banner (Horizontal) | `logo-atty-financial-banner-light.png` | 280×80px | Light | Hero sections, mastheads |
| Stacked (Vertical) | `logo-atty-financial-stacked-dark.png` | 210×210px | Dark | Business cards, avatars |
| Stacked (Vertical) | `logo-atty-financial-stacked-light.png` | 210×210px | Light | Cards, footers, app icons |

**Location:** `src/assets/`
**Full Guidelines:** [Logo Documentation](./logos.md)

### Design Token Quick Access

```css
/* Primary Colors */
--color-primary-black: #000000;
--color-primary-sand: #F6F0E4;
--color-primary-white: #FFFFFF;
--color-primary-gray: #BBBBBB;

/* Secondary Colors */
--color-secondary-green: #86BF9E;
--color-secondary-periwinkle: #CEDBFA;
--color-secondary-melon: #FDE276;
--color-secondary-yellow: #F1F698;
```

## Documentation Structure

| File | Purpose | Audience |
|------|---------|----------|
| [`tokens.md`](./tokens.md) | Design tokens with CSS custom properties and TypeScript examples | Developers, AI agents |
| [`colors.md`](./colors.md) | Complete color specifications, accessibility, and usage guidelines | Designers, developers |
| [`typography.md`](./typography.md) | Font specifications, type scale, and component usage | Designers, developers |
| [`logos.md`](./logos.md) | Logo usage guidelines, file references, and implementation examples | Designers, developers, AI agents |
| [`usage.md`](./usage.md) | Implementation examples for React, CSS, and TypeScript | Developers, AI agents |

## Token Naming Convention

All design tokens follow a consistent naming pattern:

```
--{category}-{type}-{variant}-{state}
```

**Examples:**
- `--color-primary-black` → Primary color, black variant
- `--color-secondary-green-hover` → Secondary color, green variant, hover state
- `--font-size-body-large` → Font size, body text, large variant
- `--spacing-unit-4x` → Spacing unit, 4x multiplier

## Implementation Notes

### Getting Started

1. **For React Components**: Import tokens from the design system or use Tailwind CSS config
2. **For CSS Files**: Reference CSS custom properties directly
3. **For TypeScript**: Use typed token interfaces from `tokens.md`
4. **For Design Tools**: Use hex values from `colors.md` and font specs from `typography.md`

### Color Usage Rules

- **Black** is reserved for primary text and call-to-action buttons
- **Sand** should be used for section backgrounds to create visual hierarchy
- **White** is for card backgrounds and content containers
- **Gray** is strictly for borders, dividers, and placeholder text
- **Secondary colors** are accents only—never use for primary navigation or critical text

### Typography Rules

- **Lato** is the only approved font family for both headlines and body text
- Font weights should stay within 400-700 range
- Maintain minimum contrast ratios of 4.5:1 for body text
- Headlines use tighter line heights (1.2-1.3) while body text uses 1.5-1.6

## Accessibility Standards

All implementations must meet WCAG 2.1 AA standards:
- Color contrast ratio minimum 4.5:1 for normal text
- Color contrast ratio minimum 3:1 for large text (18pt+)
- Focus indicators must be visible on all interactive elements
- Color alone must not convey information

## For AI Agents

When implementing or modifying brand elements:

1. **Reference `tokens.md`** for exact token names and values
2. **Check `colors.md`** for approved color combinations and accessibility
3. **Use `typography.md`** for font-specific guidelines and loading instructions
4. **Follow `usage.md`** for implementation patterns in specific frameworks
5. **Never deviate** from the authorized color palette or Lato font family

## Design System Integration

The brand tokens are integrated into:
- **Tailwind CSS**: See `tailwind.config.js` for theme configuration
- **Component Library**: All shadcn/ui components are customized with brand tokens
- **CSS Variables**: Global CSS file defines all custom properties

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-05 | Initial brand documentation with complete color palette and typography specs |

---

**Need Help?** Refer to specific documentation files for detailed specifications and implementation examples.
