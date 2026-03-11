/**
 * Typography Tokens
 *
 * Complete typography system for ATTY Financial brand.
 * All values are immutable constants that map to CSS custom properties.
 *
 * @see {@link https://github.com/atty-financial/docs/brand/tokens.md | Design Tokens Documentation}
 * @see {@link https://github.com/atty-financial/docs/brand/typography.md | Typography Specifications}
 */

/**
 * Font weight values
 */
export type FontWeight = 400 | 500 | 600 | 700;

/**
 * Font size token names
 */
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

/**
 * Line height token names
 */
export type LineHeightToken = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

/**
 * Letter spacing token names
 */
export type LetterSpacingToken = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider';

/**
 * Font family names
 */
export type FontFamilyName = 'base' | 'heading';

/**
 * Typography scale type for Major Third (1.25) ratio
 */
export type TypographyScale = {
  readonly xs: string;
  readonly sm: string;
  readonly base: string;
  readonly lg: string;
  readonly xl: string;
  readonly '2xl': string;
  readonly '3xl': string;
  readonly '4xl': string;
  readonly '5xl': string;
};

/**
 * Font family configuration
 * ATTY Financial uses Lato for both headlines and body text.
 */
export const fontFamily = {
  /**
   * Base font family
   * Used for: Body text, UI elements, labels, buttons
   */
  base: {
    value: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" as const,
    cssVariable: '--font-family-base' as const,
  },

  /**
   * Heading font family
   * Used for: All headings (H1-H6), section titles
   */
  heading: {
    value: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif" as const,
    cssVariable: '--font-family-heading' as const,
  },
} as const;

/**
 * Font size scale
 * Uses Major Third (1.25) ratio for harmonious sizing
 */
export const fontSize: TypographyScale = {
  /**
   * Extra Small - 12px
   * Used for: Captions, labels, very small text
   */
  xs: '0.75rem' as const,

  /**
   * Small - 14px
   * Used for: Small text, helpers, secondary labels
   */
  sm: '0.875rem' as const,

  /**
   * Base - 16px
   * Used for: Body text, standard paragraphs
   */
  base: '1rem' as const,

  /**
   * Large - 18px
   * Used for: Lead text, emphasized content
   */
  lg: '1.125rem' as const,

  /**
   * Extra Large - 20px
   * Used for: Subheadings, card titles
   */
  xl: '1.25rem' as const,

  /**
   * 2X Large - 24px
   * Used for: Section headings
   */
  '2xl': '1.5rem' as const,

  /**
   * 3X Large - 30px
   * Used for: Page headings
   */
  '3xl': '1.875rem' as const,

  /**
   * 4X Large - 36px
   * Used for: Hero headings
   */
  '4xl': '2.25rem' as const,

  /**
   * 5X Large - 48px
   * Used for: Display headings, very large titles
   */
  '5xl': '3rem' as const,
};

/**
 * Font size CSS variables mapping
 */
export const fontSizeVars: Record<FontSizeToken, string> = {
  xs: '--font-size-xs',
  sm: '--font-size-sm',
  base: '--font-size-base',
  lg: '--font-size-lg',
  xl: '--font-size-xl',
  '2xl': '--font-size-2xl',
  '3xl': '--font-size-3xl',
  '4xl': '--font-size-4xl',
  '5xl': '--font-size-5xl',
};

/**
 * Font weight values
 * ATTY Financial uses a simplified weight range (400-700) for optimal performance
 */
export const fontWeight = {
  /**
   * Regular - 400
   * Used for: Body text, standard paragraphs
   */
  regular: {
    value: 400 as const,
    cssVariable: '--font-weight-regular' as const,
  },

  /**
   * Medium - 500
   * Used for: Labels, buttons, emphasized text
   */
  medium: {
    value: 500 as const,
    cssVariable: '--font-weight-medium' as const,
  },

  /**
   * Semibold - 600
   * Used for: Subheadings, UI elements
   */
  semibold: {
    value: 600 as const,
    cssVariable: '--font-weight-semibold' as const,
  },

  /**
   * Bold - 700
   * Used for: Headlines, strong emphasis
   */
  bold: {
    value: 700 as const,
    cssVariable: '--font-weight-bold' as const,
  },
} as const;

/**
 * Line height values
 */
export const lineHeight = {
  /**
   * Tight - 1.2
   * Used for: Large headings
   */
  tight: {
    value: 1.2 as const,
    cssVariable: '--line-height-tight' as const,
  },

  /**
   * Snug - 1.375
   * Used for: Headings, subheadings
   */
  snug: {
    value: 1.375 as const,
    cssVariable: '--line-height-snug' as const,
  },

  /**
   * Normal - 1.5
   * Used for: Most text, UI elements
   */
  normal: {
    value: 1.5 as const,
    cssVariable: '--line-height-normal' as const,
  },

  /**
   * Relaxed - 1.625
   * Used for: Body text, long form content
   */
  relaxed: {
    value: 1.625 as const,
    cssVariable: '--line-height-relaxed' as const,
  },

  /**
   * Loose - 2.0
   * Used for: Very loose spacing, special cases
   */
  loose: {
    value: 2.0 as const,
    cssVariable: '--line-height-loose' as const,
  },
} as const;

/**
 * Letter spacing values
 */
export const letterSpacing = {
  /**
   * Tighter - -0.05em
   * Used for: Large headings
   */
  tighter: {
    value: '-0.05em' as const,
    cssVariable: '--letter-spacing-tighter' as const,
  },

  /**
   * Tight - -0.025em
   * Used for: Headings
   */
  tight: {
    value: '-0.025em' as const,
    cssVariable: '--letter-spacing-tight' as const,
  },

  /**
   * Normal - 0
   * Used for: Body text, normal content
   */
  normal: {
    value: '0' as const,
    cssVariable: '--letter-spacing-normal' as const,
  },

  /**
   * Wide - 0.025em
   * Used for: Uppercase text
   */
  wide: {
    value: '0.025em' as const,
    cssVariable: '--letter-spacing-wide' as const,
  },

  /**
   * Wider - 0.05em
   * Used for: Buttons, labels
   */
  wider: {
    value: '0.05em' as const,
    cssVariable: '--letter-spacing-wider' as const,
  },
} as const;

/**
 * Typography presets for common UI elements
 */
export const typographyPresets = {
  /**
   * H1 - Page Title
   */
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold.value,
    lineHeight: lineHeight.tight.value,
    letterSpacing: letterSpacing.tight.value,
  },

  /**
   * H2 - Section Title
   */
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold.value,
    lineHeight: lineHeight.tight.value,
    letterSpacing: letterSpacing.tight.value,
  },

  /**
   * H3 - Subsection Title
   */
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold.value,
    lineHeight: lineHeight.snug.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * H4 - Component Title
   */
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold.value,
    lineHeight: lineHeight.snug.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Body - Standard
   */
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular.value,
    lineHeight: lineHeight.relaxed.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Body - Large (Lead)
   */
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Body - Small
   */
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Label - Form Labels
   */
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Caption - Helper Text
   */
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.normal.value,
  },

  /**
   * Button Text
   */
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.wide.value,
  },

  /**
   * Nav Link
   */
  navLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium.value,
    lineHeight: lineHeight.normal.value,
    letterSpacing: letterSpacing.wide.value,
  },
} as const;

/**
 * Get font family value
 */
export function getFontFamily(name: FontFamilyName = 'base'): string {
  return fontFamily[name].value;
}

/**
 * Get font family CSS variable
 */
export function getFontFamilyVar(name: FontFamilyName = 'base'): string {
  return `var(${fontFamily[name].cssVariable})`;
}

/**
 * Get font size value
 */
export function getFontSize(size: FontSizeToken): string {
  return fontSize[size];
}

/**
 * Get font size CSS variable
 */
export function getFontSizeVar(size: FontSizeToken): string {
  return `var(${fontSizeVars[size]})`;
}

/**
 * Get font weight value
 */
export function getFontWeight(weight: keyof typeof fontWeight): number {
  return fontWeight[weight].value;
}

/**
 * Get font weight CSS variable
 */
export function getFontWeightVar(weight: keyof typeof fontWeight): string {
  return `var(${fontWeight[weight].cssVariable})`;
}

/**
 * Get line height value
 */
export function getLineHeight(height: LineHeightToken): number {
  return lineHeight[height].value;
}

/**
 * Get line height CSS variable
 */
export function getLineHeightVar(height: LineHeightToken): string {
  return `var(${lineHeight[height].cssVariable})`;
}

/**
 * Get letter spacing value
 */
export function getLetterSpacing(spacing: LetterSpacingToken): string {
  return letterSpacing[spacing].value;
}

/**
 * Get letter spacing CSS variable
 */
export function getLetterSpacingVar(spacing: LetterSpacingToken): string {
  return `var(${letterSpacing[spacing].cssVariable})`;
}

/**
 * Get typography preset
 */
export function getTypographyPreset(name: keyof typeof typographyPresets) {
  return typographyPresets[name];
}

/**
 * Convert rem value to pixels (assumes base font size of 16px)
 */
export function remToPx(rem: string): number {
  const value = parseFloat(rem);
  return value * 16;
}

/**
 * Convert pixels to rem (assumes base font size of 16px)
 */
export function pxToRem(px: number): string {
  return `${px / 16}rem`;
}

/**
 * All typography CSS variables
 */
export const typographyVars = {
  fontFamilyBase: fontFamily.base.cssVariable,
  fontFamilyHeading: fontFamily.heading.cssVariable,
  fontSizeXs: fontSizeVars.xs,
  fontSizeSm: fontSizeVars.sm,
  fontSizeBase: fontSizeVars.base,
  fontSizeLg: fontSizeVars.lg,
  fontSizeXl: fontSizeVars.xl,
  fontSize2xl: fontSizeVars['2xl'],
  fontSize3xl: fontSizeVars['3xl'],
  fontSize4xl: fontSizeVars['4xl'],
  fontSize5xl: fontSizeVars['5xl'],
  fontWeightRegular: fontWeight.regular.cssVariable,
  fontWeightMedium: fontWeight.medium.cssVariable,
  fontWeightSemibold: fontWeight.semibold.cssVariable,
  fontWeightBold: fontWeight.bold.cssVariable,
  lineHeightTight: lineHeight.tight.cssVariable,
  lineHeightSnug: lineHeight.snug.cssVariable,
  lineHeightNormal: lineHeight.normal.cssVariable,
  lineHeightRelaxed: lineHeight.relaxed.cssVariable,
  lineHeightLoose: lineHeight.loose.cssVariable,
  letterSpacingTighter: letterSpacing.tighter.cssVariable,
  letterSpacingTight: letterSpacing.tight.cssVariable,
  letterSpacingNormal: letterSpacing.normal.cssVariable,
  letterSpacingWide: letterSpacing.wide.cssVariable,
  letterSpacingWider: letterSpacing.wider.cssVariable,
} as const;

/**
 * Typography token type for React style objects
 */
export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number | string;
  letterSpacing?: string;
}
