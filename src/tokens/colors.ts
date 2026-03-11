/**
 * Color Tokens
 *
 * Complete color palette for ATTY Financial brand.
 * All values are immutable constants that map to CSS custom properties.
 *
 * @see {@link https://github.com/atty-financial/docs/brand/tokens.md | Design Tokens Documentation}
 * @see {@link https://github.com/atty-financial/docs/brand/colors.md | Color Specifications}
 */

/**
 * RGB color components tuple
 */
export type RGB = readonly [number, number, number];

/**
 * Color value type
 */
export type ColorValue = string;

/**
 * Primary color names
 */
export type PrimaryColorName = 'black' | 'sand' | 'white' | 'gray';

/**
 * Secondary color names
 */
export type SecondaryColorName = 'green' | 'periwinkle' | 'melon' | 'yellow';

/**
 * Semantic color names
 */
export type SemanticColorName = 'success' | 'info' | 'warning' | 'accent';

/**
 * Color name type (all colors)
 */
export type ColorName = PrimaryColorName | SecondaryColorName;

/**
 * Primary color palette
 * These are the main brand colors used throughout the application.
 */
export const primaryColors = {
  /**
   * Black
   * Used for: Primary text, call-to-action buttons, navigation links, anchors, iconography
   */
  black: {
    hex: '#000000' as const,
    rgb: [0, 0, 0] as RGB,
    cssVariable: '--color-primary-black' as const,
  },

  /**
   * Sand
   * Used for: Section backgrounds, alternate row backgrounds, page-wide backgrounds
   */
  sand: {
    hex: '#F6F0E4' as const,
    rgb: [246, 240, 228] as RGB,
    cssVariable: '--color-primary-sand' as const,
  },

  /**
   * White
   * Used for: Card backgrounds, modal backgrounds, content containers, form input backgrounds
   */
  white: {
    hex: '#FFFFFF' as const,
    rgb: [255, 255, 255] as RGB,
    cssVariable: '--color-primary-white' as const,
  },

  /**
   * Gray
   * Used for: Border lines, dividers, placeholder text, disabled state text, subtle icons
   */
  gray: {
    hex: '#BBBBBB' as const,
    rgb: [187, 187, 187] as RGB,
    cssVariable: '--color-primary-gray' as const,
  },
} as const;

/**
 * Secondary color palette
 * These are accent colors used for states, highlights, and visual interest.
 */
export const secondaryColors = {
  /**
   * Green
   * Used for: Success states, positive indicators, success button backgrounds, completed status badges
   */
  green: {
    hex: '#86BF9E' as const,
    rgb: [134, 191, 158] as RGB,
    cssVariable: '--color-secondary-green' as const,
  },

  /**
   * Periwinkle
   * Used for: Information states, info message backgrounds, neutral accent elements, tag/chip backgrounds
   */
  periwinkle: {
    hex: '#CEDBFA' as const,
    rgb: [206, 219, 250] as RGB,
    cssVariable: '--color-secondary-periwinkle' as const,
  },

  /**
   * Melon
   * Used for: Warning states, attention indicators, warning message backgrounds, feature callouts
   */
  melon: {
    hex: '#FDE276' as const,
    rgb: [253, 226, 118] as RGB,
    cssVariable: '--color-secondary-melon' as const,
  },

  /**
   * Yellow
   * Used for: Callout boxes, decorative elements, accent highlights, featured content indicators
   */
  yellow: {
    hex: '#F1F698' as const,
    rgb: [241, 246, 152] as RGB,
    cssVariable: '--color-secondary-yellow' as const,
  },
} as const;

/**
 * Semantic color palette
 * These map secondary colors to their semantic meaning in the UI.
 */
export const semanticColors = {
  /**
   * Success color (maps to Green)
   * Used for: Success messages, confirmations, positive indicators
   */
  success: {
    hex: '#86BF9E' as const,
    rgb: [134, 191, 158] as RGB,
    cssVariable: '--color-success' as const,
    lightHex: '#A8D4B6' as const,
    bgHex: '#E8F5ED' as const,
  },

  /**
   * Info color (maps to Periwinkle)
   * Used for: Information messages, neutral tags, calendar highlights
   */
  info: {
    hex: '#CEDBFA' as const,
    rgb: [206, 219, 250] as RGB,
    cssVariable: '--color-info' as const,
    lightHex: '#E3E9FC' as const,
    bgHex: '#F0F4FF' as const,
  },

  /**
   * Warning color (maps to Melon)
   * Used for: Warning messages, attention-grabbing elements
   */
  warning: {
    hex: '#FDE276' as const,
    rgb: [253, 226, 118] as RGB,
    cssVariable: '--color-warning' as const,
    lightHex: '#FEEB9E' as const,
    bgHex: '#FEF8E8' as const,
  },

  /**
   * Accent color (maps to Yellow)
   * Used for: Decorative accents, featured content highlights
   */
  accent: {
    hex: '#F1F698' as const,
    rgb: [241, 246, 152] as RGB,
    cssVariable: '--color-accent' as const,
    lightHex: '#F7FAB8' as const,
    bgHex: '#FBFDE8' as const,
  },
} as const;

/**
 * All color constants combined
 */
export const colors = {
  ...primaryColors,
  ...secondaryColors,
  ...semanticColors,
} as const;

/**
 * Color value by name
 * Get a color value by its name
 *
 * @example
 * ```ts
 * import { getColor } from '@/tokens/colors';
 *
 * const black = getColor('black'); // '#000000'
 * const green = getColor('green'); // '#86BF9E'
 * ```
 */
export function getColor(name: ColorName): ColorValue {
  return colors[name]?.hex || '';
}

/**
 * Get CSS variable for a color
 *
 * @example
 * ```ts
 * import { getColorVar } from '@/tokens/colors';
 *
 * const blackVar = getColorVar('black'); // 'var(--color-primary-black)'
 * ```
 */
export function getColorVar(name: ColorName): string {
  return `var(${colors[name]?.cssVariable || ''})`;
}

/**
 * Get semantic color value
 *
 * @example
 * ```ts
 * import { getSemanticColor } from '@/tokens/colors';
 *
 * const success = getSemanticColor('success'); // '#86BF9E'
 * const successBg = getSemanticColor('success', 'bg'); // '#E8F5ED'
 * ```
 */
export function getSemanticColor(
  name: SemanticColorName,
  variant: 'normal' | 'light' | 'bg' = 'normal'
): ColorValue {
  const color = semanticColors[name];
  if (variant === 'light') return color.lightHex;
  if (variant === 'bg') return color.bgHex;
  return color.hex;
}

/**
 * Check if a color is a primary color
 */
export function isPrimaryColor(name: ColorName): name is PrimaryColorName {
  return name in primaryColors;
}

/**
 * Check if a color is a secondary color
 */
export function isSecondaryColor(name: ColorName): name is SecondaryColorName {
  return name in secondaryColors;
}

/**
 * Type guard for color name
 */
export function isColorName(value: string): value is ColorName {
  return value in colors;
}

/**
 * All color hex values
 */
export const colorHexes = {
  primaryBlack: primaryColors.black.hex,
  primarySand: primaryColors.sand.hex,
  primaryWhite: primaryColors.white.hex,
  primaryGray: primaryColors.gray.hex,
  secondaryGreen: secondaryColors.green.hex,
  secondaryPeriwinkle: secondaryColors.periwinkle.hex,
  secondaryMelon: secondaryColors.melon.hex,
  secondaryYellow: secondaryColors.yellow.hex,
  success: semanticColors.success.hex,
  info: semanticColors.info.hex,
  warning: semanticColors.warning.hex,
  accent: semanticColors.accent.hex,
} as const;

/**
 * All color CSS variables
 */
export const colorVars = {
  primaryBlack: primaryColors.black.cssVariable,
  primarySand: primaryColors.sand.cssVariable,
  primaryWhite: primaryColors.white.cssVariable,
  primaryGray: primaryColors.gray.cssVariable,
  secondaryGreen: secondaryColors.green.cssVariable,
  secondaryPeriwinkle: secondaryColors.periwinkle.cssVariable,
  secondaryMelon: secondaryColors.melon.cssVariable,
  secondaryYellow: secondaryColors.yellow.cssVariable,
  success: semanticColors.success.cssVariable,
  info: semanticColors.info.cssVariable,
  warning: semanticColors.warning.cssVariable,
  accent: semanticColors.accent.cssVariable,
} as const;
