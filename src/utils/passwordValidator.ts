/**
 * Password Validator
 *
 * Password strength validation and complexity checking.
 *
 * @module utils/passwordValidator
 */

// ============================================
// Types
// ============================================

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  score: number; // 0-4, where 4 is strongest
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  requireNoCommonPasswords: boolean;
  maxLength?: number;
}

// ============================================
// Constants
// ============================================

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  '123456789',
  '12345',
  '1234567',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'welcome',
  'monkey',
  'dragon',
  '111111',
  'baseball',
  'iloveyou',
  'trustno1',
  'sunshine',
  'master',
  'ashley',
  'bailey',
  'passw0rd',
  'football',
  'jesus',
  'michael',
  'ninja',
  'mustang',
  'shadow',
  'superman',
  'charlie',
  'donald',
  'princess',
  'admin123',
  'letmein',
  'rosy',
  'starwars',
  'login',
  'password1',
  'login123',
  'princess1',
  'admin1234',
  'welcome1',
  'login1',
  'shadow1',
  'sunshine1',
  'football1',
  'superman1',
  'monkey1',
  'trustno12',
  'dragon1',
  'baseball1',
  'master1',
  'mustang1',
  'jordan1',
  'michael1',
  'jennifer1',
  'harley1',
  '1234567890',
  '1234567891',
  '1234567892',
  '1234567893',
  '1234567894',
  '1234567895',
  '1234567896',
  '1234567897',
  '1234567898',
  '1234567899',
]);

// ============================================
// Validation Rules
// ============================================

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  requireNoCommonPasswords: true,
  maxLength: 128,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Check if password contains any common passwords
 */
const containsCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.has(password.toLowerCase());
};

/**
 * Calculate password score based on length and complexity
 */
const calculatePasswordScore = (password: string, requirements: PasswordRequirements): number => {
  let score = 0;

  // Length bonus
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;

  // Complexity bonuses
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Max score is 4
  return Math.min(score, 4);
};

/**
 * Check if password meets all requirements
 */
const meetsRequirements = (
  password: string,
  requirements: PasswordRequirements
): boolean => {
  if (password.length < requirements.minLength) {
    return false;
  }

  if (requirements.maxLength && password.length > requirements.maxLength) {
    return false;
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    return false;
  }

  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    return false;
  }

  if (requirements.requireNoCommonPasswords && containsCommonPassword(password)) {
    return false;
  }

  return true;
};

// ============================================
// Main Validation Function
// ============================================

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @param requirements - Password requirements (optional, defaults to strong requirements)
 * @returns Validation result with score and errors
 *
 * @example
 * ```typescript
 * const result = validatePassword('StrongPass123!');
 * console.log(result.isValid); // true
 * console.log(result.score); // 4
 * ```
 */
export const validatePassword = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidation => {
  const errors: string[] = [];

  // Check length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (requirements.maxLength && password.length > requirements.maxLength) {
    errors.push(`Password must be at most ${requirements.maxLength} characters long`);
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check numbers
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special characters
  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check common passwords
  if (requirements.requireNoCommonPasswords && containsCommonPassword(password)) {
    errors.push('Password is too common. Please choose a stronger password.');
  }

  const isValid = errors.length === 0;
  const score = calculatePasswordScore(password, requirements);

  return {
    isValid,
    errors,
    score,
  };
};

/**
 * Get password strength level
 *
 * @param password - Password to evaluate
 * @returns Strength level and description
 *
 * @example
 * ```typescript
 * const { level, description } = getPasswordStrength('StrongPass123!');
 * console.log(level); // 'Strong'
 * console.log(description); // 'Excellent'
 * ```
 */
export const getPasswordStrength = (password: string): {
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Excellent';
  description: string;
  score: number;
} => {
  const validation = validatePassword(password);
  const score = validation.score;

  switch (score) {
    case 0:
    case 1:
      return {
        level: 'Very Weak',
        description: 'Use a stronger password',
        score,
      };
    case 2:
      return {
        level: 'Weak',
        description: 'Password could be stronger',
        score,
      };
    case 3:
      return {
        level: 'Fair',
        description: 'Password is acceptable but could be stronger',
        score,
      };
    case 4:
      return {
        level: 'Strong',
        description: 'Excellent password',
        score,
      };
    default:
      return {
        level: 'Very Weak',
        description: 'Use a stronger password',
        score,
      };
  }
};

/**
 * Check if password is safe to use
 *
 * @param password - Password to check
 * @returns True if password is safe to use
 */
export const isPasswordSafe = (password: string): boolean => {
  const validation = validatePassword(password);
  return validation.isValid;
};

/**
 * Get password strength score as percentage
 *
 * @param password - Password to evaluate
 * @returns Strength percentage (0-100)
 */
export const getPasswordStrengthPercentage = (password: string): number => {
  const validation = validatePassword(password);
  return (validation.score / 4) * 100;
};

/**
 * Get password requirements as an array of strings
 *
 * @param requirements - Password requirements
 * @returns Array of requirement strings
 */
export const getPasswordRequirements = (
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] => {
  const requirementsList: string[] = [];

  if (requirements.minLength) {
    requirementsList.push(`At least ${requirements.minLength} characters`);
  }

  if (requirements.requireUppercase) {
    requirementsList.push('One uppercase letter');
  }

  if (requirements.requireLowercase) {
    requirementsList.push('One lowercase letter');
  }

  if (requirements.requireNumbers) {
    requirementsList.push('One number');
  }

  if (requirements.requireSpecialChars) {
    requirementsList.push('One special character');
  }

  if (requirements.requireNoCommonPasswords) {
    requirementsList.push('Not a common password');
  }

  return requirementsList;
};

/**
 * Generate a secure random password
 *
 * @param length - Length of password (default: 16)
 * @returns Secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + specialChars;

  let password = '';
  for (let i = 0; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password;
};

// ============================================
// Export
// ============================================

export type { PasswordValidation, PasswordRequirements };
