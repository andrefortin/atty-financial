// Constants for ATTY Financial Application

// ============================================
// Brand Colors
// ============================================
export const BRAND_COLORS = {
  // Primary Colors
  primaryBlack: '#000000', // Black
  primarySand: '#F6F0E4', // Sand
  primaryWhite: '#FFFFFF', // White
  primaryGray: '#BBBBBB', // Gray

  // Secondary Colors
  secondaryGreen: '#86BF9E', // Green
  secondaryPeriwinkle: '#CEDBFA', // Periwinkle
  secondaryMelon: '#FDE276', // Melon
  secondaryYellow: '#F1F698', // Yellow

  // Semantic Colors
  success: '#86BF9E', // Success (Green)
  info: '#CEDBFA', // Info (Periwinkle)
  warning: '#FDE276', // Warning (Melon)
  accent: '#F1F698', // Accent (Yellow)
  error: '#EF4444', // Error (Red)

  // Legacy Color Aliases (for backward compatibility)
  primary: '#000000', // Primary (Black)
  secondary: '#CEDBFA', // Secondary (Periwinkle)

  // Neutral Colors
  neutral: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
} as const;

// ============================================
// Typography
// ============================================
export const TYPOGRAPHY = {
  fontFamily: {
    base: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    heading: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    mono: 'Courier New, monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// Transaction Types
// ============================================
export const TRANSACTION_TYPES = ['Draw', 'Principal Payment', 'Interest Autodraft'] as const;

// ============================================
// Matter Status
// ============================================
export const MATTER_STATUS = ['Active', 'Closed', 'Archive'] as const;

// ============================================
// Status Badge Colors
// ============================================
export const STATUS_COLORS = {
  Active: { bg: 'var(--color-success-bg)', text: 'var(--color-primary-black)' },
  Closed: { bg: 'var(--color-warning-bg)', text: 'var(--color-primary-black)' },
  Archive: { bg: 'var(--color-neutral-200)', text: 'var(--color-neutral-700)' },
  Unassigned: { bg: 'var(--color-error-bg)', text: 'var(--color-error-dark)' },
  Assigned: { bg: 'var(--color-info-bg)', text: 'var(--color-primary-black)' },
  Allocated: { bg: 'var(--color-success-bg)', text: 'var(--color-primary-black)' },
  Warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-primary-black)' },
  Error: { bg: 'var(--color-error-bg)', text: 'var(--color-error-dark)' },
} as const;

// ============================================
// Alert Thresholds (days)
// ============================================
export const ALERT_THRESHOLDS = {
  WARNING: 20, // Yellow warning at 20-29 days
  ERROR: 30, // Red error at 30+ days
} as const;

// ============================================
// Interest Calculation Constants
// ============================================
export const INTEREST_CONSTANTS = {
  DAYS_IN_YEAR: 360, // ACT/360 convention
  DEFAULT_PRIME_RATE: 8.5, // 8.5%
  DEFAULT_MODIFIER: 2.5, // +2.5%
  PRINCIPAL_REPAYMENT_DAYS: 30, // Must repay within 30 days of case closure
} as const;

// ============================================
// Validation Rules
// ============================================
export const VALIDATION = {
  MATTER_ID: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[A-Za-z0-9\-_]+$/,
  },
  CLIENT_NAME: {
    minLength: 2,
    maxLength: 200,
  },
  AMOUNT: {
    min: 0.01,
    max: 999999999.99,
    decimals: 2,
  },
  NOTES: {
    maxLength: 1000,
  },
} as const;

// ============================================
// Date Formats
// ============================================
export const DATE_FORMATS = {
  DISPLAY: 'MMMM d, yyyy',
  INPUT: 'yyyy-MM-dd',
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM d, yyyy h:mm a',
} as const;

// ============================================
// Export Formats
// ============================================
export const EXPORT_FORMATS = ['PDF', 'CSV', 'Excel'] as const;

// ============================================
// Navigation Items
// ============================================
export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'matters', label: 'Matters', icon: 'Briefcase' },
  { id: 'transactions', label: 'Transactions', icon: 'Receipt' },
  { id: 'calculators', label: 'Calculators', icon: 'Calculator' },
  { id: 'reports', label: 'Reports', icon: 'FileText' },
  { id: 'allocation', label: 'Interest Allocation', icon: 'PieChart' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
] as const;

// ============================================
// Table Configurations
// ============================================
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  DEFAULT_SORT_COLUMN: 'date',
  DEFAULT_SORT_DIRECTION: 'desc',
} as const;

// ============================================
// Toast Messages
// ============================================
export const TOAST_MESSAGES = {
  MATTER_CREATED: 'Matter created successfully',
  MATTER_UPDATED: 'Matter updated successfully',
  MATTER_DELETED: 'Matter deleted successfully',
  TRANSACTION_CREATED: 'Transaction created successfully',
  TRANSACTION_ALLOCATED: 'Transaction allocated successfully',
  INTEREST_ALLOCATED: 'Interest allocated successfully',
  REPORT_GENERATED: 'Report generated successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  CERTIFICATION_COMPLETED: 'Compliance certification completed',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  VALIDATION_ERROR: 'Please fix errors before submitting',
} as const;

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  DUPLICATE_MATTER_ID: 'A matter with this ID already exists',
  CLOSE_MATTER_WITH_BALANCE: 'Cannot close a matter with outstanding principal balance',
  NEGATIVE_AMOUNT: 'Amount cannot be negative',
  PAYMENT_EXCEEDS_BALANCE: 'Payment amount cannot exceed principal balance',
  ASSIGN_TO_CLOSED_MATTER: 'Cannot assign transaction to a closed/archived matter',
  MISSING_ALLOCATIONS: 'All prior transactions must be categorized before interest allocation',
  RATE_CHANGE_FUTURE: 'Rate changes cannot be set in the future',
  INVALID_DATE_RANGE: 'End date must be after start date',
} as const;

// ============================================
// Disclaimers
// ============================================
export const DISCLAIMERS = {
  INTEREST_PROJECTION:
    'This calculation is an estimate only and does not account for potential rate changes. Use for planning purposes only.',
  BANK_FEED_DELAY:
    'Bank feed transactions may take 1-2 business days to appear. Please verify all transactions against your bank statements.',
} as const;

// ============================================
// Feature Flags (for development)
// ============================================
export const FEATURE_FLAGS = {
  BANK_INTEGRATION_ENABLED: false, // Future feature
  AUTO_ALLOCATE_ENABLED: false, // Future feature
  EMAIL_NOTIFICATIONS_ENABLED: false, // Future feature
} as const;
