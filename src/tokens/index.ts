/**
 * Design Tokens
 *
 * Central entry point for all ATTY Financial brand design tokens.
 * Exports color, typography, spacing, and other design system values.
 *
 * @see {@link https://github.com/atty-financial/docs/brand/README.md | Brand Documentation}
 * @see {@link https://github.com/atty-financial/docs/brand/tokens.md | Design Tokens Reference}
 */

// Re-export all color tokens
export * from './colors';

// Re-export all typography tokens
export * from './typography';

/**
 * Spacing tokens
 * Based on 4px base unit for consistent spacing throughout the application
 */
export const spacing = {
  0: '0' as const,
  1: '0.25rem' as const,   /* 4px */
  2: '0.5rem' as const,    /* 8px */
  3: '0.75rem' as const,   /* 12px */
  4: '1rem' as const,      /* 16px */
  5: '1.25rem' as const,   /* 20px */
  6: '1.5rem' as const,    /* 24px */
  8: '2rem' as const,      /* 32px */
  10: '2.5rem' as const,   /* 40px */
  12: '3rem' as const,     /* 48px */
  16: '4rem' as const,     /* 64px */
  20: '5rem' as const,     /* 80px */
  24: '6rem' as const,     /* 96px */
};

/**
 * Spacing CSS variables
 */
export const spacingVars = {
  0: '--spacing-0',
  1: '--spacing-1',
  2: '--spacing-2',
  3: '--spacing-3',
  4: '--spacing-4',
  5: '--spacing-5',
  6: '--spacing-6',
  8: '--spacing-8',
  10: '--spacing-10',
  12: '--spacing-12',
  16: '--spacing-16',
  20: '--spacing-20',
  24: '--spacing-24',
} as const;

/**
 * Border radius tokens
 */
export const borderRadius = {
  none: '0' as const,
  sm: '0.25rem' as const,   /* 4px */
  md: '0.375rem' as const,  /* 6px */
  lg: '0.5rem' as const,    /* 8px */
  xl: '0.75rem' as const,   /* 12px */
  '2xl': '1rem' as const,   /* 16px */
  full: '9999px' as const,
};

/**
 * Border radius CSS variables
 */
export const borderRadiusVars = {
  none: '--radius-none',
  sm: '--radius-sm',
  md: '--radius-md',
  lg: '--radius-lg',
  xl: '--radius-xl',
  '2xl': '--radius-2xl',
  full: '--radius-full',
} as const;

/**
 * Shadow tokens
 * Used for elevation and depth in the UI
 */
export const shadow = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' as const,
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' as const,
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' as const,
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' as const,
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' as const,
};

/**
 * Shadow CSS variables
 */
export const shadowVars = {
  xs: '--shadow-xs',
  sm: '--shadow-sm',
  md: '--shadow-md',
  lg: '--shadow-lg',
  xl: '--shadow-xl',
} as const;

/**
 * Z-index tokens
 * For layering and stacking context
 */
export const zIndex = {
  dropdown: 1000 as const,
  sticky: 1020 as const,
  fixed: 1030 as const,
  modalBackdrop: 1040 as const,
  modal: 1050 as const,
  popover: 1060 as const,
  tooltip: 1070 as const,
};

/**
 * Z-index CSS variables
 */
export const zIndexVars = {
  dropdown: '--z-index-dropdown',
  sticky: '--z-index-sticky',
  fixed: '--z-index-fixed',
  modalBackdrop: '--z-index-modal-backdrop',
  modal: '--z-index-modal',
  popover: '--z-index-popover',
  tooltip: '--z-index-tooltip',
} as const;

/**
 * Transition tokens
 * For consistent animation timing
 */
export const transition = {
  fast: '150ms ease' as const,
  base: '200ms ease' as const,
  slow: '300ms ease' as const,
};

/**
 * Transition CSS variables
 */
export const transitionVars = {
  fast: '--transition-fast',
  base: '--transition-base',
  slow: '--transition-slow',
} as const;

/**
 * Get spacing value
 *
 * @example
 * ```ts
 * import { getSpacing } from '@/tokens';
 *
 * const padding = getSpacing(4); // '1rem'
 * ```
 */
export function getSpacing(value: keyof typeof spacing): string {
  return spacing[value];
}

/**
 * Get spacing CSS variable
 */
export function getSpacingVar(value: keyof typeof spacing): string {
  return `var(${spacingVars[value]})`;
}

/**
 * Get border radius value
 */
export function getBorderRadius(value: keyof typeof borderRadius): string {
  return borderRadius[value];
}

/**
 * Get border radius CSS variable
 */
export function getBorderRadiusVar(value: keyof typeof borderRadius): string {
  return `var(${borderRadiusVars[value]})`;
}

/**
 * Get shadow value
 */
export function getShadow(value: keyof typeof shadow): string {
  return shadow[value];
}

/**
 * Get shadow CSS variable
 */
export function getShadowVar(value: keyof typeof shadow): string {
  return `var(${shadowVars[value]})`;
}

/**
 * Get z-index value
 */
export function getZIndex(value: keyof typeof zIndex): number {
  return zIndex[value];
}

/**
 * Get z-index CSS variable
 */
export function getZIndexVar(value: keyof typeof zIndex): string {
  return `var(${zIndexVars[value]})`;
}

/**
 * Get transition value
 */
export function getTransition(value: keyof typeof transition): string {
  return transition[value];
}

/**
 * Get transition CSS variable
 */
export function getTransitionVar(value: keyof typeof transition): string {
  return `var(${transitionVars[value]})`;
}

/**
 * Complete design tokens object
 * All tokens in one place for easy access
 */
export const tokens = {
  colors: {
    primary: {
      black: '#000000',
      sand: '#F6F0E4',
      white: '#FFFFFF',
      gray: '#BBBBBB',
    },
    secondary: {
      green: '#86BF9E',
      periwinkle: '#CEDBFA',
      melon: '#FDE276',
      yellow: '#F1F698',
    },
    semantic: {
      success: '#86BF9E',
      info: '#CEDBFA',
      warning: '#FDE276',
      accent: '#F1F698',
    },
  },
  typography: {
    fontFamily: {
      base: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      heading: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  transition: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
} as const;

/**
 * Design tokens type
 */
export type DesignTokens = typeof tokens;

/**
 * All CSS variables
 * Complete list of all CSS custom properties
 */
export const allCssVars = {
  // Colors
  colorPrimaryBlack: '--color-primary-black',
  colorPrimarySand: '--color-primary-sand',
  colorPrimaryWhite: '--color-primary-white',
  colorPrimaryGray: '--color-primary-gray',
  colorSecondaryGreen: '--color-secondary-green',
  colorSecondaryPeriwinkle: '--color-secondary-periwinkle',
  colorSecondaryMelon: '--color-secondary-melon',
  colorSecondaryYellow: '--color-secondary-yellow',
  colorSuccess: '--color-success',
  colorInfo: '--color-info',
  colorWarning: '--color-warning',
  colorAccent: '--color-accent',

  // Typography
  fontFamilyBase: '--font-family-base',
  fontFamilyHeading: '--font-family-heading',
  fontSizeXs: '--font-size-xs',
  fontSizeSm: '--font-size-sm',
  fontSizeBase: '--font-size-base',
  fontSizeLg: '--font-size-lg',
  fontSizeXl: '--font-size-xl',
  fontSize2xl: '--font-size-2xl',
  fontSize3xl: '--font-size-3xl',
  fontSize4xl: '--font-size-4xl',
  fontSize5xl: '--font-size-5xl',
  fontWeightRegular: '--font-weight-regular',
  fontWeightMedium: '--font-weight-medium',
  fontWeightSemibold: '--font-weight-semibold',
  fontWeightBold: '--font-weight-bold',
  lineHeightTight: '--line-height-tight',
  lineHeightSnug: '--line-height-snug',
  lineHeightNormal: '--line-height-normal',
  lineHeightRelaxed: '--line-height-relaxed',
  lineHeightLoose: '--line-height-loose',
  letterSpacingTighter: '--letter-spacing-tighter',
  letterSpacingTight: '--letter-spacing-tight',
  letterSpacingNormal: '--letter-spacing-normal',
  letterSpacingWide: '--letter-spacing-wide',
  letterSpacingWider: '--letter-spacing-wider',

  // Spacing
  spacing0: '--spacing-0',
  spacing1: '--spacing-1',
  spacing2: '--spacing-2',
  spacing3: '--spacing-3',
  spacing4: '--spacing-4',
  spacing5: '--spacing-5',
  spacing6: '--spacing-6',
  spacing8: '--spacing-8',
  spacing10: '--spacing-10',
  spacing12: '--spacing-12',
  spacing16: '--spacing-16',
  spacing20: '--spacing-20',
  spacing24: '--spacing-24',

  // Border Radius
  radiusNone: '--radius-none',
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusXl: '--radius-xl',
  radius2xl: '--radius-2xl',
  radiusFull: '--radius-full',

  // Shadows
  shadowXs: '--shadow-xs',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',

  // Z-Index
  zIndexDropdown: '--z-index-dropdown',
  zIndexSticky: '--z-index-sticky',
  zIndexFixed: '--z-index-fixed',
  zIndexModalBackdrop: '--z-index-modal-backdrop',
  zIndexModal: '--z-index-modal',
  zIndexPopover: '--z-index-popover',
  zIndexTooltip: '--z-index-tooltip',

  // Transitions
  transitionFast: '--transition-fast',
  transitionBase: '--transition-base',
  transitionSlow: '--transition-slow',
} as const;
