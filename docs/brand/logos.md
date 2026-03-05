# Logo Guidelines

Complete logo usage guidelines for ATTY Financial brand, including file specifications, usage scenarios, and implementation examples.

## Logo Files

### Available Logo Variants

| File Name | Type | Dimensions | Size | Usage |
|-----------|------|------------|-------|--------|
| `logo-atty-financial-banner-dark.png` | Banner/Horizontal | 280×90px | 9.6KB | Dark backgrounds, headers |
| `logo-atty-financial-banner-light.png` | Banner/Horizontal | 280×80px | 9.7KB | Light backgrounds, hero sections |
| `logo-atty-financial-stacked-dark.png` | Stacked/Vertical | 210×210px | 10KB | Dark backgrounds, vertical layouts |
| `logo-atty-financial-stacked-light.png` | Stacked/Vertical | 210×210px | 11KB | Light backgrounds, cards, footers |

### File Location

```
src/assets/
├── logo-atty-financial-banner-dark.png
├── logo-atty-financial-banner-light.png
├── logo-atty-financial-stacked-dark.png
└── logo-atty-financial-stacked-light.png
```

### Naming Convention

```
logo-atty-financial-{layout}-{mode}.png

Where:
- layout: "banner" or "stacked"
- mode: "dark" or "light"
```

## Logo Types

### Banner Logo (Horizontal)

**Dimensions:** 280×90px (dark), 280×80px (light)

**When to Use:**
- Page headers
- Navigation bars
- Email signatures (wide layout)
- Document headers
- Website mastheads
- Social media cover images

**Best For:**
- Wide horizontal spaces
- When text needs to be readable alongside logo
- Primary branding elements
- Professional business contexts

### Stacked Logo (Vertical)

**Dimensions:** 210×210px (both variants)

**When to Use:**
- Business cards
- Letterheads
- Favicon (cropped version)
- Social media avatars
- App icons
- Vertical layout constraints
- Compact spaces

**Best For:**
- Square or vertical spaces
- When logo needs to stand alone
- Icon/avatartype applications
- Mobile apps

## Dark vs Light Mode

### Dark Logos

**Files:**
- `logo-atty-financial-banner-dark.png`
- `logo-atty-financial-stacked-dark.png`

**When to Use:**
- Dark backgrounds (#000000, #1a1a1a, dark gray)
- Dark mode interfaces
- Hero sections with dark backgrounds
- Overlays on dark images
- Night mode designs

**Background Colors Compatible:**
- Black (#000000)
- Dark Gray (#1a1a1a, #333333)
- Deep Navy/Black backgrounds
- Any background where logo is the lightest element

### Light Logos

**Files:**
- `logo-atty-financial-banner-light.png`
- `logo-atty-financial-stacked-light.png`

**When to Use:**
- Light backgrounds (#FFFFFF, #F6F0E4, light gray)
- Light mode interfaces
- White/light sand backgrounds
- Printed materials (light paper)
- Day mode designs

**Background Colors Compatible:**
- White (#FFFFFF)
- Sand (#F6F0E4)
- Light Gray (#F7FAFC, #EDF2F7)
- Any background where logo is the darkest element
- Print on white/light paper

## Sizing Guidelines

### Minimum Sizes

| Context | Minimum Width | Recommended |
|----------|---------------|--------------|
| Favicon | 16×16px, 32×32px | Use stacked logo cropped |
| Mobile Header | 120px width | Banner logo scaled |
| Desktop Header | 200px width | Banner logo |
| Email Signature | 150px width | Banner logo |
| Business Card | 80px width | Stacked logo |
| Social Media | 180×180px | Stacked logo |
| Letterhead | 100px height | Banner or stacked |

### Responsive Scaling

```css
/* Mobile (< 768px) */
.logo-mobile {
  width: 120px;
  height: auto;
}

/* Tablet (768px - 1024px) */
.logo-tablet {
  width: 160px;
  height: auto;
}

/* Desktop (> 1024px) */
.logo-desktop {
  width: 200px;
  height: auto;
}
```

## Spacing and Clearance

### Minimum Clearance

Always maintain minimum clearance around logos:

| Context | Clearance |
|----------|-----------|
| Text to left/right | 1em (16px) |
| Text above/below | 0.5em (8px) |
| Other logos | 2em (32px) |
| Page edges | 1rem (16px) |

### Logo Protection Space

```css
/* Properly spaced logo container */
.logo-container {
  /* Logo itself */
  img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Clearances */
  padding: var(--spacing-4);
  margin: var(--spacing-4);

  /* Protection space */
  min-height: 60px;
  min-width: 120px;
}
```

## Accessibility Guidelines

### Alt Text

Always provide descriptive alt text for screen readers:

```html
<!-- Good -->
<img
  src="/assets/logo-atty-financial-banner-dark.png"
  alt="ATTY Financial - Case Cost Line of Credit Tracking"
  class="logo"
>

<!-- Bad -->
<img
  src="/assets/logo-atty-financial-banner-dark.png"
  alt="logo"
  class="logo"
>
```

### Alt Text Patterns

| Context | Alt Text Example |
|----------|------------------|
| Home page | "ATTY Financial - Case Cost Line of Credit Tracking" |
| Header | "ATTY Financial logo" |
| Footer | "ATTY Financial" |
| Email | "ATTY Financial - Credit line platform" |
| Document | "ATTY Financial letterhead" |

### ARIA Labels

For logos that are links:

```html
<a href="/" aria-label="ATTY Financial Home">
  <img
    src="/assets/logo-atty-financial-banner-dark.png"
    alt="ATTY Financial"
  >
</a>
```

## Implementation Examples

### React Component - Logo

```tsx
import React from 'react';

type LogoVariant = 'banner' | 'stacked';
type LogoMode = 'dark' | 'light';

interface LogoProps {
  variant?: LogoVariant;
  mode?: LogoMode;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function Logo({
  variant = 'banner',
  mode = 'dark',
  className = '',
  alt = 'ATTY Financial',
  width,
  height,
}: LogoProps) {
  const logoPath = `/assets/logo-atty-financial-${variant}-${mode}.png`;

  const defaultDimensions = {
    banner: { width: 280, height: 90 },
    stacked: { width: 210, height: 210 },
  };

  const dimensions = {
    width: width || defaultDimensions[variant].width,
    height: height || defaultDimensions[variant].height,
  };

  return (
    <img
      src={logoPath}
      alt={alt}
      className={className}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        display: 'block',
      }}
    />
  );
}
```

### React Component - Logo with Responsive Sizing

```tsx
import React from 'react';

export function ResponsiveLogo({ variant = 'banner', mode = 'dark' }) {
  return (
    <picture>
      {/* Mobile */}
      <source
        media="(max-width: 767px)"
        srcSet={`/assets/logo-atty-financial-${variant}-${mode}.png`}
      />
      {/* All devices - image serves as fallback */}
      <img
        src={`/assets/logo-atty-financial-${variant}-${mode}.png`}
        alt="ATTY Financial"
        className="logo"
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </picture>
  );
}
```

### Header Component with Logo

```tsx
import React from 'react';
import { Logo } from './Logo';

export function Header() {
  return (
    <header style={{
      backgroundColor: 'var(--color-primary-black)',
      padding: 'var(--spacing-4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{
        flex: 1,
      }}>
        <Logo
          variant="banner"
          mode="dark"
          alt="ATTY Financial - Home"
          width={200}
        />
      </div>

      {/* Navigation */}
      <nav>...</nav>
    </header>
  );
}
```

### CSS Implementation

```css
/* Logo base styles */
.logo {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

/* Banner logo specific */
.logo--banner {
  width: 280px;
  height: 90px;
}

/* Stacked logo specific */
.logo--stacked {
  width: 210px;
  height: 210px;
}

/* Dark mode logo */
.logo--dark {
  filter: brightness(1);
}

/* Light mode logo */
.logo--light {
  filter: brightness(1);
}

/* Responsive sizing */
@media (max-width: 767px) {
  .logo--banner {
    width: 120px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .logo--banner {
    width: 160px;
  }
}
```

### Next.js Image Optimization

```tsx
import Image from 'next/image';

export function OptimizedLogo({
  variant = 'banner',
  mode = 'dark',
  width = 280,
}: LogoProps) {
  return (
    <Image
      src={`/assets/logo-atty-financial-${variant}-${mode}.png`}
      alt="ATTY Financial"
      width={width}
      height={variant === 'banner' ? 90 : 210}
      priority // Above the fold
      unoptimized={false}
    />
  );
}
```

## Common Use Cases

### 1. Page Header

```tsx
<Header>
  <Logo variant="banner" mode="dark" />
</Header>
```

**Background:** Black (#000000) → Use dark logo

### 2. Landing Page Hero

```tsx
<Hero style={{ backgroundColor: 'var(--color-primary-sand)' }}>
  <Logo variant="stacked" mode="light" width={300} />
  <h1>Case Cost Line of Credit Tracking</h1>
</Hero>
```

**Background:** Sand (#F6F0E4) → Use light logo

### 3. Email Signature

```html
<table>
  <tr>
    <td style="padding: 8px;">
      <img
        src="https://attyfinancial.com/assets/logo-atty-financial-banner-dark.png"
        alt="ATTY Financial"
        width="180"
        style="display: block;"
      >
    </td>
    <td style="padding: 8px; font-family: Lato, sans-serif;">
      <p>John Smith</p>
      <p>john@attyfinancial.com</p>
    </td>
  </tr>
</table>
```

**Background:** White/light → Use dark logo

### 4. Business Card

```
[Stacked Logo - 80px wide]
John Smith
Managing Partner
john@attyfinancial.com
```

**Background:** White card stock → Use light logo

### 5. Favicon

Use stacked logo, cropped to square:

```html
<link
  rel="icon"
  type="image/png"
  href="/favicon.png"
  sizes="32x32"
>
```

**Generate:** Crop 210×210px stacked logo to center and save as 32×32px

### 6. Login Page

```tsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--color-primary-sand)',
}}>
  <Logo variant="stacked" mode="light" width={200} />
  <LoginForm />
</div>
```

**Background:** Sand → Use light logo

### 7. Sidebar/Navigation

```tsx
<Sidebar>
  <div style={{ padding: 'var(--spacing-6)' }}>
    <Logo variant="stacked" mode="dark" width={140} />
  </div>
  <Navigation />
</Sidebar>
```

**Background:** Black → Use dark logo

## Do's and Don'ts

### DO ✅

✅ Use appropriate logo variant for background color
✅ Maintain minimum clearance around logo
✅ Provide descriptive alt text
✅ Use logo as link wrapper (ARIA label)
✅ Scale logos proportionally (maintain aspect ratio)
✅ Use CSS max-width for responsive sizing
✅ Test logos on both light and dark backgrounds
✅ Optimize images for web (PNG with proper compression)
✅ Use proper file naming convention

### DON'T ❌

❌ Don't stretch or distort logo dimensions
❌ Don't use dark logo on light background
❌ Don't use light logo on dark background
❌ Don't remove alt text or use generic alt
❌ Don't place other elements too close to logo
❌ Don't use logo larger than original dimensions (quality loss)
❌ Don't convert to lossy formats (JPEG) for logos
❌ Don't use generic alt text like "logo" or "image"
❌ Don't rotate or flip logo
❌ Don't add drop shadows or effects
❌ Don't change logo colors
❌ Don't modify logo in any way

## Logo Protection Rules

### Minimum Protection Space

```
┌─────────────────────────────┐
│  ← 16px → LOGO ← 16px →  │  ← 16px ↑
│                             │
│  ← 16px →             ← 16px →  │
│                             │
│  ← 16px →             ← 16px →  │  ← 16px ↓
└─────────────────────────────┘
```

### No-Overlap Zone

Never place other branding elements, text, or graphics within:
- **16px** of logo edges (minimum)
- **32px** of other logos (multiple logos)

### Size Proportionality

Maintain aspect ratio when scaling:

```css
/* Good */
.logo {
  width: 200px;
  height: auto; /* Maintains aspect ratio */
}

/* Bad */
.logo {
  width: 200px;
  height: 100px; /* Distorts logo */
}
```

## Color Mode Selection Guide

### Quick Reference

| Background Color | Use Logo | Reason |
|----------------|-----------|---------|
| #000000 (Black) | Dark | Logo is lightest element |
| #1a1a1a | Dark | Dark gray background |
| #333333 | Dark | Medium gray background |
| #F6F0E4 (Sand) | Light | Logo is darkest element |
| #FFFFFF (White) | Light | White background |
| #F7FAFC | Light | Light gray background |
| #EDF2F7 | Light | Light gray background |

### Automatic Mode Selection

```tsx
function getLogoMode(backgroundColor: string): 'dark' | 'light' {
  // Light backgrounds (use light/dark logo)
  const lightBackgrounds = ['#FFFFFF', '#F6F0E4', '#F7FAFC', '#EDF2F7'];
  return lightBackgrounds.includes(backgroundColor) ? 'light' : 'dark';
}
```

## Troubleshooting

### Logo Not Visible

**Check:**
1. Verify file path is correct
2. Check file permissions
3. Verify image is not hidden (z-index)
4. Check contrast with background

### Logo Distorted

**Solutions:**
1. Remove fixed height/width, use only one dimension
2. Set other dimension to `auto`
3. Use `max-width` instead of `width` for responsive

### Wrong Logo Variant Showing

**Check:**
1. Verify mode (dark/light) matches background
2. Test on different screen sizes
3. Check CSS specificity
4. Verify correct file is imported

## File Naming Pattern

Always use this pattern:

```
logo-atty-financial-{layout}-{mode}.png

Examples:
✅ logo-atty-financial-banner-dark.png
✅ logo-atty-financial-stacked-light.png

❌ logo-dark.png (missing prefix)
❌ atty-logo.png (wrong pattern)
❌ logo-atty-financil.png (typo!)
```

## Additional Resources

- [Brand Documentation](./README.md)
- [Color Specifications](./colors.md)
- [Typography Guidelines](./typography.md)
- [Implementation Guide](./usage.md)
- [Brand Verification Script](../../scripts/verify-brand-tokens.ts)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-05 | Initial logo guidelines with all variants and usage examples |
