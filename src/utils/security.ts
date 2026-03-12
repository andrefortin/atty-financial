/**
 * Security Utilities
 *
 * Utility functions for security operations including CSRF token generation,
 * token validation, and request validation helpers.
 *
 * @module utils/security
 */

import { randomBytes, createHash } from 'crypto';

// ============================================
// Types
// ============================================

export interface CSRFToken {
  token: string;
  createdAt: number;
  expiresAt: number;
}

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
}

export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// CSRF Token Generation
// ============================================

/**
 * Generate a CSRF token
 *
 * Creates a cryptographically secure CSRF token with expiration
 *
 * @param ttl - Time to live in milliseconds (default: 30 minutes)
 * @returns CSRF token object
 */
export const generateCSRFToken = (ttl: number = 30 * 60 * 1000): CSRFToken => {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + ttl;

  return {
    token,
    createdAt: now,
    expiresAt,
  };
};

/**
 * Generate a session token
 *
 * Creates a session token for authentication
 *
 * @param userId - User ID to associate with token
 * @param ttl - Time to live in milliseconds (default: 24 hours)
 * @returns Session token object
 */
export const generateSessionToken = (
  userId: string,
  ttl: number = 24 * 60 * 60 * 1000
): CSRFToken => {
  const token = createHash('sha256')
    .update(`${userId}-${Date.now()}-${randomBytes(16).toString('hex')}`)
    .digest('hex');

  const now = Date.now();
  const expiresAt = now + ttl;

  return {
    token,
    createdAt: now,
    expiresAt,
  };
};

/**
 * Verify a CSRF token
 *
 * Checks if a token is valid and not expired
 *
 * @param token - CSRF token to verify
 * @param storedToken - Stored token to compare against
 * @returns Validation result
 */
export const verifyCSRFToken = (
  token: string,
  storedToken: CSRFToken
): TokenValidationResult => {
  // Check if token matches
  if (token !== storedToken.token) {
    return {
      valid: false,
      error: 'Invalid token',
    };
  }

  // Check if token is expired
  const now = Date.now();
  if (now > storedToken.expiresAt) {
    return {
      valid: false,
      error: 'Token expired',
    };
  }

  return {
    valid: true,
  };
};

/**
 * Verify a session token
 *
 * Checks if a session token is valid and not expired
 *
 * @param token - Session token to verify
 * @param storedToken - Stored token to compare against
 * @returns Validation result
 */
export const verifySessionToken = (
  token: string,
  storedToken: CSRFToken
): TokenValidationResult => {
  // Check if token matches
  if (token !== storedToken.token) {
    return {
      valid: false,
      error: 'Invalid session token',
    };
  }

  // Check if token is expired
  const now = Date.now();
  if (now > storedToken.expiresAt) {
    return {
      valid: false,
      error: 'Session expired',
    };
  }

  return {
    valid: true,
  };
};

// ============================================
// Request Validation
// ============================================

/**
 * Validate request method
 *
 * @param method - Request method to validate
 * @param allowedMethods - Allowed methods
 * @returns Validation result
 */
export const validateRequestMethod = (
  method: string,
  allowedMethods: string[]
): TokenValidationResult => {
  const normalizedMethod = method.toUpperCase();

  if (!allowedMethods.includes(normalizedMethod)) {
    return {
      valid: false,
      error: `Method ${normalizedMethod} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    };
  }

  return {
    valid: true,
  };
};

/**
 * Validate request headers
 *
 * @param headers - Request headers
 * @param requiredHeaders - Required headers
 * @returns Validation result
 */
export const validateRequestHeaders = (
  headers: Record<string, string>,
  requiredHeaders: string[]
): RequestValidationResult => {
  const errors: string[] = [];

  for (const header of requiredHeaders) {
    if (!headers[header]) {
      errors.push(`Missing required header: ${header}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate request body
 *
 * @param body - Request body
 * @param requiredFields - Required fields
 * @returns Validation result
 */
export const validateRequestBody = (
  body: any,
  requiredFields: string[]
): RequestValidationResult => {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize input
 *
 * Removes potentially dangerous characters from input
 *
 * @param input - Input to sanitize
 * @returns Sanitized input
 */
export const sanitizeInput = (input: string): string => {
  // Remove script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized;
};

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns Validation result
 */
export const validateEmail = (email: string): TokenValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return {
    valid: true,
  };
};

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 8)
 * @returns Validation result
 */
export const validatePasswordStrength = (
  password: string,
  minLength: number = 8
): TokenValidationResult => {
  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters long`,
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return {
    valid: true,
  };
};

/**
 * Validate phone number
 *
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export const validatePhoneNumber = (phone: string): TokenValidationResult => {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it has at least 10 digits
  if (digits.length < 10) {
    return {
      valid: false,
      error: 'Invalid phone number',
    };
  }

  return {
    valid: true,
  };
};

// ============================================
// Security Headers
// ============================================

/**
 * Get security headers for API responses
 *
 * @returns Security headers object
 */
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
};

// ============================================
// Export
// ============================================

export type { CSRFToken, TokenValidationResult, RequestValidationResult };
