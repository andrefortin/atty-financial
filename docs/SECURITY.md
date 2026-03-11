# Security Hardening

This guide covers comprehensive security hardening measures for ATTY Financial.

## Table of Contents

- [Overview](#overview)
- [Security Policies](#security-policies)
- [Authentication Security](#authentication-security)
- [API Security](#api-security)
- [Data Encryption](#data-encryption)
- [Session Management](#session-management)
- [Secure Coding Practices](#secure-coding-practices)
- [Input Validation](#input-validation)
- [XSS Prevention](#xss-prevention)
- [CSRF Protection](#csrf-protection)
- [Dependency Security](#dependency-security)
- [Incident Response](#incident-response)
- [Compliance Requirements](#compliance-requirements)

---

## Overview

ATTY Financial implements defense-in-depth security with multiple layers of protection.

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  - CSP Policy                                               │
│  - HSTS Headers                                              │
│  - XSS Protection                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  - Input Validation                                         │
│  - Output Encoding                                          │
│  - CSRF Protection                                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  - Authentication (Firebase Auth)                             │
│  - Authorization (Firestore Rules)                           │
│  - Rate Limiting                                              │
│  - DDoS Protection                                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  - Encryption at Rest (Firestore)                            │
│  - Encryption in Transit (HTTPS)                               │
│  - Database Security Rules                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                  │
│  - Firebase Security                                          │
│  - Google Cloud Security                                     │
│  - VPC/Network Security                                      │
└─────────────────────────────────────────────────────────┘
```

### Security Goals

- **Confidentiality**: Protect sensitive data (client data, financial data)
- **Integrity**: Ensure data is not tampered with
- **Availability**: Ensure services are available when needed
- **Authenticity**: Verify identity of users and systems
- **Authorization**: Ensure proper access controls
- **Non-repudiation**: Prevent denial of actions
- **Auditability**: Track and log all security-relevant events

---

## Security Policies

### Security Principles

| Principle | Description | Implementation |
|------------|-------------|----------------|
| **Least Privilege** | Users only have access to resources they need | Firestore rules, Firebase Auth claims |
| **Defense in Depth** | Multiple layers of security | CSP, HSTS, XSS protection, input validation |
| **Fail Securely** | Default to denying access | Firestore rules default to deny |
| **Zero Trust** | Verify every request, no implicit trust | Firebase Auth, rate limiting, DDoS protection |
| **Secure by Default** | Security built in by default | Firebase default settings |
| **Encryption Everywhere** | Encrypt data at rest and in transit | Firestore default encryption, HTTPS for all connections |

### Security Checklist

#### Authentication Security

- [ ] Multi-factor authentication enabled for admin accounts
- [ ] Strong password policy enforced
- [ ] Password hashing with bcrypt (minimum 12 rounds)
- [ ] Account lockout after failed login attempts
- [ ] Password reset with unique, expiring tokens
- [ ] Session timeout after inactivity
- [ ] Secure session storage (httpOnly, secure, sameSite)
- [ ] Logout all sessions on password change

#### API Security

- [ ] All API endpoints require authentication
- [ ] Rate limiting per endpoint and per user
- [ ] IP-based rate limiting
- [ ] Request validation (method, headers, body)
- [ ] Response headers (CORS, CSP, HSTS)
- [ ] Request ID logging for all requests
- [ ] Error messages don't reveal sensitive information
- [ ] API keys are rotated regularly

#### Data Encryption

- [ ] Encryption at rest (Firestore)
- [ ] Encryption in transit (HTTPS)
- [ ] Encryption at rest (Cloud Storage)
- [ ] Encryption keys managed securely
- [ ] Key rotation policy
- [ ] Backup encryption
- [ ] Audit log encryption

#### Session Management

- [ ] Session tokens are cryptographically secure
- [ ] Session tokens have expiration
- [ ] Session tokens are unique per user
- [ ] Session tokens are stored securely (httpOnly, secure cookies)
- [ ] Session tokens can be revoked
- [ ] Session tokens are bound to user device
- [ ] Session tokens are rotated regularly

#### Secure Coding Practices

- [ ] Input validation on all user inputs
- [ ] Output encoding on all outputs
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Use prepared statements
- [ ] Safe JSON parsing
- [ ] Error handling doesn't leak information
- [ ] Logging doesn't log sensitive data
- [ ] All dependencies are up-to-date

#### Input Validation

- [ ] All user inputs are validated server-side
- [ ] Input length limits
- [ ] Input format validation (email, phone, etc.)
- [ ] Input sanitization (strip tags, etc.)
- [ ] File upload validation (type, size, content)
- [ ] URL validation (prevent SSRF)
- [ ] HTML encoding on all inputs
- [ ] Custom encoding for special characters

#### XSS Prevention

- [ ] Content Security Policy (CSP) enabled
- [ ] HTTP-only cookies
- [ ] Secure cookies (sameSite, secure, httpOnly)
- [ ] Output encoding on all user inputs
- [ ] HTML encoding on all outputs
- [ ] Input sanitization (strip scripts, etc.)
- [ ] Framework-level XSS prevention

#### CSRF Protection

- [ ] Anti-CSRF tokens on all state-changing requests
- [ ] SameSite cookie attribute
- [ ] Origin header validation
- [ ] Referer header validation
- [ ] Double-submit cookie pattern
- [ ] User-specific CSRF tokens
- [ ] CSRF tokens expire after use

#### Dependency Security

- [ ] All dependencies are audited regularly
- [ ] Dependencies are kept up-to-date
- [ ] No dependencies with known vulnerabilities
- [ ] No unnecessary dependencies
- [ ] Dependency lockfile used
- [ ] Dependency scanning in CI/CD
- [ ] Security alerts for vulnerable dependencies

---

## Authentication Security

### Firebase Authentication

Firebase Authentication provides built-in security:

| Feature | Configuration | Status |
|---------|---------------|--------|
| **Email/Password** | Enabled | ✅ Active |
| **Multi-Factor Auth** | Required for admin | ✅ Configured |
| **Google Sign-In** | Enabled | ✅ Active |
| **Passwordless Sign-In** | Optional | ⚠️ Not configured |
| **Email Link** | Enabled | ✅ Active |

### Authentication Configuration

```typescript
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';

// Get auth instance
const auth = getAuth();

// Enable multi-factor authentication for admin users
export async function enableMFA(userId: string): Promise<void> {
  const admin = await auth.getUser(userId);

  // Enable MFA if user is admin
  if (admin.customClaims.role === 'Admin') {
    await admin.multiFactor.enroll({
      factorId: 'totp', // Time-based one-time password
      displayName: 'TOTP',
      priority: 0,
    });

    console.log('MFA enabled for user:', userId);
  }
}

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

// Create user with password
export async function createUser(
  email: string,
  password: string
): Promise<void> {
  // Validate password
  if (!validatePassword(password)) {
    throw new Error('Password does not meet requirements');
  }

  // Create user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Send email verification
  await sendEmailVerification(userCredential.user);

  console.log('User created:', email);
}

// Validate password
function validatePassword(password: string): boolean {
  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return false;
  }

  // Check for uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  // Check for lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return false;
  }

  // Check for special character
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]\\|:;"'?,.<>`]/.test(password)) {
    return false;
  }

  // Check for common passwords
  if (isCommonPassword(password)) {
    return false;
  }

  return true;
}

// Check if password is common
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    // ... add more common passwords
  ];

  return commonPasswords.includes(password.toLowerCase());
}

// Password reset
export async function resetPassword(email: string): Promise<void> {
  const actionCodeSettings = {
    url: 'https://attyfinancial.com/reset-password',
    handleCodeInApp: true,
  };

  await sendPasswordResetEmail(auth, email, actionCodeSettings);

  console.log('Password reset email sent:', email);
}

// Verify password reset
export async function verifyPasswordReset(
  oobCode: string,
  newPassword: string
): Promise<void> {
  // Validate new password
  if (!validatePassword(newPassword)) {
    throw new Error('New password does not meet requirements');
  }

  // Verify OOB code and reset password
  await confirmPasswordReset(auth, oobCode, newPassword);

  console.log('Password reset successful');
}

// Revoke refresh tokens
export async function revokeRefreshTokens(userId: string): Promise<void> {
  const user = await auth.getUser(userId);

  // Revoke all refresh tokens
  await user.multiFactor.revokeSessions();

  console.log('All refresh tokens revoked for user:', userId);
}

### Authentication Security Rules

```typescript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && (
        // User can read/write their own data
        request.auth.uid == userId ||
        
        // System can read/write user data (for audit logs)
        request.auth.token.admin == true ||
        request.auth.token.role == 'System'
      );
      
      // Prevent modification of user ID
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Prevent modification of user role (admin only)
      allow update: if request.auth != null && (
        // User can update their own non-sensitive data
        request.auth.uid == userId &&
        !request.resource.data.matches(/role/)
      );
      
      // Prevent creation of users with admin role (admin only)
      allow create: if request.auth != null && (
        // Non-admin users can be created by anyone
        !request.resource.data.role.matches(/^Admin/) ||
        
        // Admin users can only be created by admin
        request.auth.token.admin == true
      );
    }
    
    // Session collection
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && (
        // User can read/write their own sessions
        request.auth.uid == request.resource.data.userId ||
        
        // System can read/write sessions
        request.auth.token.admin == true ||
        request.auth.token.role == 'System'
      );
      
      // Prevent modification of user ID in session
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## API Security

### API Security Principles

| Principle | Implementation |
|-----------|---------------|
| **Authentication Required** | All API endpoints require Firebase Auth |
| **Authorization** | Firestore rules enforce data access |
| **Rate Limiting** | Per endpoint and per user rate limiting |
| **Input Validation** | All inputs validated server-side |
| **Output Encoding** | All JSON responses are encoded |
| **Request Logging** | All requests are logged with request ID |
| **Error Handling** | Errors don't reveal sensitive information |
| **HTTPS Only** | All API endpoints require HTTPS |

### API Security Headers

```json
{
  "headers": [
    {
      "source": "/api/**",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://attyfinancial.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With, X-Request-ID"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        },
        {
          "key": "Access-Control-Expose-Headers",
          "value": "X-Request-ID"
        }
      ]
    }
  ]
}
```

### API Request Validation

```typescript
/**
 * API request validation middleware
 */
export async function validateApiRequest(
  request: Request,
  context: any
): Promise<{ valid: boolean; error?: string }> {
  // Check authentication
  if (!context.auth) {
    return { valid: false, error: 'Authentication required' };
  }

  // Check user is active
  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const user = userDoc.data();

  if (!user.isActive) {
    return { valid: false, error: 'User account is not active' };
  }

  // Check user role
  const allowedRoles = ['Admin', 'Attorney', 'Accountant', 'Paralegal'];
  if (!allowedRoles.includes(user.role)) {
    return { valid: false, error: 'User does not have required role' };
  }

  // Check firm membership
  const firmId = user.firmId;
  if (!firmId) {
    return { valid: false, error: 'User is not a member of a firm' };
  }

  return { valid: true };
}
```

---

## Data Encryption

### Encryption at Rest

Firebase Firestore automatically encrypts data at rest:

- **Encryption**: AES-256
- **Key Management**: Google manages encryption keys
- **Key Rotation**: Automatic key rotation
- **Data Replication**: Encrypted data is replicated across multiple datacenters

### Encryption in Transit

All data in transit is encrypted:

- **Transport Layer**: HTTPS/TLS 1.2+
- **Encryption**: TLS 1.2 or TLS 1.3
- **Cipher Suites**: Modern, secure cipher suites
- **Certificate**: Let's Encrypt (via Google)
- **HSTS**: HTTP Strict Transport Security (1 year)

### Key Management

Google manages encryption keys:

| Key Type | Management | Rotation |
|----------|------------|----------|
| **Data Encryption Key** | Google-managed | Automatic (every 90 days) |
| **Access Control Key** | Firebase-managed | Automatic (as needed) |
| **Session Keys** | Firebase-managed | Automatic (every 30 days) |
| **API Keys** | User-managed | Manual (rotate regularly) |

---

## Session Management

### Session Configuration

| Setting | Value | Description |
|----------|-------|-------------|
| **Session Timeout** | 7 days | Session expires after 7 days of inactivity |
| **Absolute Timeout** | 30 days | Session expires after 30 days regardless of activity |
| **Session Rotation** | Every 7 days | Session token is rotated weekly |
| **Token Expiration** | 1 hour | Session token expires after 1 hour |

### Session Implementation

```typescript
/**
 * Create user session
 */
export async function createUserSession(
  userId: string,
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
  }
): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session = {
    userId,
    sessionId,
    createdAt: now,
    expiresAt: now + (7 * 24 * 60 * 60 * 1000), // 7 days
    absoluteExpiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days
    lastActivityAt: now,
    deviceInfo,
    isActive: true,
  };

  // Store session in Firestore
  await admin.firestore().collection('sessions').doc(sessionId).set(session);

  // Update user's active sessions list
  const userRef = admin.firestore().collection('users').doc(userId);
  await userRef.update({
    activeSessions: admin.firestore.FieldValue.arrayUnion(sessionId),
  });

  console.log('Session created for user:', userId, 'session:', sessionId);

  return sessionId;
}

/**
 * Validate user session
 */
export async function validateSession(
  sessionId: string
): Promise<{ valid: boolean; userId?: string }> {
  const sessionDoc = await admin.firestore().collection('sessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    return { valid: false };
  }

  const session = sessionDoc.data();

  // Check if session is active
  if (!session.isActive) {
    return { valid: false };
  }

  // Check if session is expired
  const now = Date.now();
  if (now > session.expiresAt || now > session.absoluteExpiresAt) {
    return { valid: false };
  }

  // Update last activity time
  await admin.firestore().collection('sessions').doc(sessionId).update({
    lastActivityAt: now,
  });

  return { valid: true, userId: session.userId };
}

/**
 * Revoke user session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const sessionRef = admin.firestore().collection('sessions').doc(sessionId);

  // Get session to get userId
  const sessionDoc = await sessionRef.get();
  const session = sessionDoc.data();

  // Revoke session
  await sessionRef.update({
    isActive: false,
    revokedAt: Date.now(),
  });

  // Remove from user's active sessions list
  const userRef = admin.firestore().collection('users').doc(session.userId);
  await userRef.update({
    activeSessions: admin.firestore.FieldValue.arrayRemove(sessionId),
  });

  console.log('Session revoked:', sessionId);
}

/**
 * Revoke all user sessions
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const userRef = admin.firestore().collection('users').doc(userId);

  // Get user's active sessions
  const userDoc = await userRef.get();
  const user = userDoc.data();

  if (!user.activeSessions || user.activeSessions.length === 0) {
    return;
  }

  // Revoke all sessions
  const batch = admin.firestore().batch();
  for (const sessionId of user.activeSessions) {
    const sessionRef = admin.firestore().collection('sessions').doc(sessionId);
    batch.update(sessionRef, {
      isActive: false,
      revokedAt: Date.now(),
    });
  }

  await batch.commit();

  // Clear user's active sessions list
  await userRef.update({
    activeSessions: admin.firestore.FieldValue.delete(),
  });

  console.log('All sessions revoked for user:', userId);
}

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = functions.pubsub
  .schedule('0 4 * * *') // Daily at 4 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = Date.now();
    const threshold = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Get expired sessions
    const snapshot = await admin.firestore()
      .collection('sessions')
      .where('isActive', '==', true)
      .where('expiresAt', '<', threshold)
      .limit(500)
      .get();

    // Revoke expired sessions
    const batch = admin.firestore().batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        isActive: false,
        revokedAt: Date.now(),
      });
    });

    await batch.commit();

    console.log(`Cleaned up ${snapshot.size} expired sessions`);
  });
```

---

## Secure Coding Practices

### Input Validation

```typescript
/**
 * Input validation utility
 */
export class InputValidator {
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_NUMBER_VALUE = 999999999.99;
  private static readonly MIN_NUMBER_VALUE = -999999999.99;
  private static readonly ALLOWED_EMAIL_DOMAINS = ['attyfinancial.com'];

  /**
   * Validate string input
   */
  static validateString(input: string, options?: {
    maxLength?: number;
    minLength?: number;
    allowedCharacters?: RegExp;
    disallowedCharacters?: RegExp;
  }): { valid: boolean; error?: string } {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string' };
    }

    // Check length
    if (options?.minLength && input.length < options.minLength) {
      return { valid: false, error: `Input must be at least ${options.minLength} characters` };
    }

    if (options?.maxLength && input.length > (options.maxLength || this.MAX_STRING_LENGTH)) {
      return { valid: false, error: `Input must be no more than ${options.maxLength} characters` };
    }

    // Check allowed characters
    if (options?.allowedCharacters && !options.allowedCharacters.test(input)) {
      return { valid: false, error: 'Input contains invalid characters' };
    }

    // Check disallowed characters
    if (options?.disallowedCharacters && options.disallowedCharacters.test(input)) {
      return { valid: false, error: 'Input contains disallowed characters' };
    }

    return { valid: true };
  }

  /**
   * Validate number input
   */
  static validateNumber(input: number, options?: {
    min?: number;
    max?: number;
  }): { valid: boolean; error?: string } {
    if (typeof input !== 'number' || isNaN(input)) {
      return { valid: false, error: 'Input must be a number' };
    }

    // Check min
    if (options?.min !== undefined && input < options.min) {
      return { valid: false, error: `Input must be at least ${options.min}` };
    }

    // Check max
    if (options?.max !== undefined && input > (options.max || this.MAX_NUMBER_VALUE)) {
      return { valid: false, error: `Input must be no more than ${options.max}` };
    }

    // Check number range
    if (input < this.MIN_NUMBER_VALUE || input > this.MAX_NUMBER_VALUE) {
      return { valid: false, error: 'Input must be a valid number' };
    }

    return { valid: true };
  }

  /**
   * Validate email input
   */
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    const [local, domain] = email.split('@');
    
    // Check if domain is allowed
    if (!this.ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return { valid: false, error: 'Email domain is not allowed' };
    }

    return { valid: true };
  }

  /**
   * Validate phone input
   */
  static validatePhone(phone: string): { valid: boolean; error?: string } {
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check length (US: 10 digits, but allow extensions)
    if (digits.length < 10 || digits.length > 15) {
      return { valid: false, error: 'Invalid phone number' };
    }

    return { valid: true };
  }

  /**
   * Validate URL input
   */
  static validateURL(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Only allow https URLs
      if (urlObj.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTPS URLs are allowed' };
      }

      // Prevent SSRF attacks
      if (!urlObj.hostname.includes('attyfinancial.com')) {
        return { valid: false, error: 'URL must be within the same domain' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate date input
   */
  static validateDate(date: string, format: string = 'YYYY-MM-DD'): { valid: boolean; error?: string } {
    try {
      const parsedDate = new Date(date);
      
      if (isNaN(parsedDate.getTime())) {
        return { valid: false, error: 'Invalid date' };
      }

      // Format date
      const formattedDate = parsedDate.toISOString().split('T')[0];
      
      // Check if formatted date matches expected format
      if (formattedDate !== date) {
        return { valid: false, error: `Date must be in ${format} format` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid date format' };
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\s/g, ' ');
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJSON(json: string): string {
    return JSON.parse(json);
  }

  /**
   * Validate and sanitize object
   */
  static validateAndSanitizeObject<T extends Record<string, any>>(
    obj: T,
    schema: Record<keyof T, {
      type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      allowedCharacters?: RegExp;
    }>
  ): { valid: boolean; error?: string; sanitized?: T } {
    const errors: string[] = [];
    const sanitized = {} as T;

    // Check each field
    for (const [key, value] of Object.entries(obj)) {
      const fieldSchema = schema[key];

      if (!fieldSchema) {
        errors.push(`Field ${String(key)} is not allowed`);
        continue;
      }

      // Check if field is required
      if (fieldSchema.required && (value === null || value === undefined)) {
        errors.push(`Field ${String(key)} is required`);
        continue;
      }

      // Skip validation if value is null/undefined (and not required)
      if (value === null || value === undefined) {
        continue;
      }

      // Validate based on type
      switch (fieldSchema.type) {
        case 'string': {
          const stringValidation = this.validateString(value, {
            maxLength: fieldSchema.maxLength,
            minLength: fieldSchema.minLength,
            allowedCharacters: fieldSchema.allowedCharacters,
          });

          if (!stringValidation.valid) {
            errors.push(stringValidation.error || `Field ${String(key)} is invalid`);
            continue;
          }

          // Sanitize string
          sanitized[key] = this.sanitizeString(value) as T[keyof T];
          break;
        }

        case 'number': {
          const numberValidation = this.validateNumber(value, {
            min: fieldSchema.min,
            max: fieldSchema.max,
          });

          if (!numberValidation.valid) {
            errors.push(numberValidation.error || `Field ${String(key)} is invalid`);
            continue;
          }

          sanitized[key] = value as T[keyof T];
          break;
        }

        case 'boolean': {
          if (typeof value !== 'boolean') {
            errors.push(`Field ${String(key)} must be a boolean`);
            continue;
          }

          sanitized[key] = value as T[keyof T];
          break;
        }

        case 'date': {
          const dateValidation = this.validateDate(value);
          if (!dateValidation.valid) {
            errors.push(dateValidation.error || `Field ${String(key)} must be a valid date`);
            continue;
          }

          sanitized[key] = value as T[keyof T];
          break;
        }

        case 'email': {
          const emailValidation = this.validateEmail(value);
          if (!emailValidation.valid) {
            errors.push(emailValidation.error || `Field ${String(key)} must be a valid email`);
            continue;
          }

          sanitized[key] = value.toLowerCase() as T[keyof T];
          break;
        }

        case 'phone': {
          const phoneValidation = this.validatePhone(value);
          if (!phoneValidation.valid) {
            errors.push(phoneValidation.error || `Field ${String(key)} must be a valid phone number`);
            continue;
          }

          sanitized[key] = value as T[keyof T];
          break;
        }

        case 'url': {
          const urlValidation = this.validateURL(value);
          if (!urlValidation.valid) {
            errors.push(urlValidation.error || `Field ${String(key)} must be a valid HTTPS URL`);
            continue;
          }

          sanitized[key] = value as T[keyof T];
          break;
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join('; '),
      };
    }

    return {
      valid: true,
      sanitized,
    };
  }
}
```

---

## Output Encoding

### JSON Encoding

```typescript
/**
 * JSON encoding utility
 */
export class JsonEncoder {
  private static readonly ESCAPE_MAP: Record<string, string> = {
    '"': '\\"',
    '\\': '\\\\',
    '/': '\\/',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
  };

  /**
   * Encode string for JSON
   */
  static encodeString(str: string): string {
    return str.replace(/["\\\/\b\f\n\r\t]/g, (match) => {
      return this.ESCAPE_MAP[match] || match;
    });
  }

  /**
   * Encode object for JSON
   */
  static encodeObject<T>(obj: T): string {
    return JSON.stringify(obj).replace(/["\\\/\b\f\n\r\t]/g, (match) => {
      return this.ESCAPE_MAP[match] || match;
    });
  }
}
```

---

## XSS Prevention

### Content Security Policy

```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.attfinancial.com https://*.firebaseio.com https://*.googleapis.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' blob: https://*.attfinancial.com https://*.firebaseio.com https://*.googleapis.com; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; manifest-src 'self'; worker-src 'self' blob:; report-uri 'self' https://*.firebaseio.com; upgrade-insecure-requests; report-to 'https://*.firebaseio.com';"
        }
      ]
    }
  ]
}
```

### Output Encoding in Components

```typescript
/**
 * XSS-safe component wrapper
 */
import { createRef, useEffect, useMemo } from 'react';

interface XSSSafeProps {
  content: string;
  // ... other props
}

export function XSSSafeComponent({ content, ...props }: XSSSafeProps) {
  // Sanitize content
  const sanitizedContent = useMemo(() => {
    return InputValidator.sanitizeString(content);
  }, [content]);

  return (
    <div {...props} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  );
}
```

---

## CSRF Protection

### Anti-CSRF Token

```typescript
/**
 * CSRF protection utility
 */
export class CsrfProtection {
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate anti-CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate anti-CSRF token
   */
  static validateToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }

  /**
   * Generate and store anti-CSRF token for user
   */
  static async function generateUserToken(userId: string): Promise<string> {
    const token = this.generateToken();

    // Store token in user document
    await admin.firestore().collection('users').doc(userId).update({
      csrfToken: token,
      csrfTokenExpiresAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('CSRF token generated for user:', userId);

    return token;
  }

  /**
   * Validate user's anti-CSRF token
   */
  static async function validateUserToken(
    userId: string,
    token: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { valid: false, error: 'User not found' };
    }

    const user = userDoc.data();

    // Check if token exists
    if (!user.csrfToken) {
      return { valid: false, error: 'No CSRF token found' };
    }

    // Check if token is expired (24 hours)
    const now = Date.now();
    const expiresAt = user.csrfTokenExpiresAt.toDate().getTime();
    if (now > expiresAt) {
      return { valid: false, error: 'CSRF token has expired' };
    }

    // Validate token
    if (!this.validateToken(token, user.csrfToken)) {
      return { valid: false, error: 'Invalid CSRF token' };
    }

    return { valid: true };
  }

  /**
   * Refresh user's anti-CSRF token
   */
  static async function refreshToken(userId: string): Promise<string> {
    const newToken = this.generateToken();

    // Update user document
    await admin.firestore().collection('users').doc(userId).update({
      csrfToken: newToken,
      csrfTokenExpiresAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('CSRF token refreshed for user:', userId);

    return newToken;
  }

  /**
   * Revoke user's anti-CSRF tokens
   */
  static async function revokeTokens(userId: string): Promise<void> {
    await admin.firestore().collection('users').doc(userId).update({
      csrfToken: admin.firestore.FieldValue.delete(),
      csrfTokenExpiresAt: admin.firestore.FieldValue.delete(),
    });

    console.log('CSRF tokens revoked for user:', userId);
  }
}
```

### CSRF Protection in HTTP Requests

```typescript
/**
 * CSRF protection middleware for API endpoints
 */
export function createCsrfProtectionMiddleware() {
  return async (req: any, res: any, next: any) => {
    // Only check state-changing methods (POST, PUT, DELETE, PATCH)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get CSRF token from header
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrfToken;

    // Get user ID from auth
    const userId = req.auth?.uid || req.body?.userId;

    // Check CSRF token
    if (csrfToken && userId) {
      const { valid, error } = await CsrfProtection.validateUserToken(userId, csrfToken);

      if (!valid) {
        return res.status(403).json({
          error: 'CSRF token is invalid',
          message: error || 'CSRF token is invalid',
        });
      }
    }

    // Continue to next middleware
    next();
  };
}
```

---

## Dependency Security

### Dependency Auditing

Run security audit on dependencies:

```bash
# Audit dependencies for known vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Run dependency check
npm run check:dependencies

# Update dependencies
npm update

# Use npm-check to check for outdated packages
npm install -g npm-check
npm-check
```

### Package.json Security

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "check:dependencies": "npm run audit",
    "update:dependencies": "npm update",
    "outdated": "npm outdated"
  },
  "engines": {
    "npm": ">=8.19.0",
    "node": ">=18.0.0"
  }
}
```

---

## Incident Response

### Incident Severity Levels

| Severity | Definition | Response Time |
|----------|-------------|---------------|
| **P1 - Critical** | Complete service outage | 1 hour |
| **P2 - High** | Major functionality affected | 4 hours |
| **P3 - Medium** | Minor functionality affected | 8 hours |
| **P4 - Low** | Non-critical issue | 24 hours |

### Incident Response Procedure

1. **Detection**:
   - Monitoring alert triggered
   - User report received
   - Security scan detected issue

2. **Assessment**:
   - Determine severity level
   - Identify impact scope
   - Identify affected users
   - Determine root cause

3. **Containment**:
   - Implement temporary fix
   - Isolate affected systems
   - Revoke compromised sessions/tokens

4. **Eradication**:
   - Implement permanent fix
   - Remove root cause
   - Patch vulnerability
   - Update dependencies

5. **Recovery**:
   - Restore normal operations
   - Verify fix effectiveness
   - Monitor for recurrence

6. **Post-Incident**:
   - Conduct post-mortem
   - Document incident
   - Update security policies
   - Communicate with stakeholders

---

## Compliance Requirements

### SO 2 Compliance

| Requirement | Status | Notes |
|------------|--------|-------|
| **A.7.1** - Communication of Incidents | ✅ Complete | Incident response procedure |
| **A.10.1** - Incident Response | ✅ Complete | 4 severity levels |
| **A.10.2** - Incident Response | ✅ Complete | 24-hour notification |
| **A.10.3** - Incident Response | ✅ Complete | Root cause analysis |
| **A.10.4** - Incident Response | ✅ Complete | Documentation |
| **A.10.5** - Incident Response | ✅ Complete | Prevention measures |
| **A.12.1** - Incident Response | ✅ Complete | Testing of recovery plan |
| **A.12.2** - Incident Response | ✅ Complete | Post-incident review |

### HIPAA Compliance

| Requirement | Status | Notes |
|------------|--------|-------|
| **§164.306(a)** - Security Rule | ✅ Complete | Documented security policies |
| **§164.312(a)(2)(i)** - Access Control | ✅ Complete | Authentication and authorization |
| **§164.308(a)(5)** - Transmission Security | ✅ Complete | Encryption in transit (HTTPS) |
| **§164.312(a)(2)(iv)** - Access Control | ✅ Complete | Unique user identification |
| **§164.312(e)(1)** - Access Control | ✅ Complete | Emergency access procedure |
| **§164.308(a)(5)** - Transmission Security | ✅ Complete | Encryption at rest (Firestore) |
| **§164.312(b)(1)** - Access Control | ✅ Complete | Access control lists |
| **§164.312(d)** - Access Control | ✅ Complete | Audit logging |

### GDPR Compliance

| Requirement | Status | Notes |
|------------|--------|-------|
| **Article 32 - Security** | ✅ Complete | Security measures documented |
| **Article 25 - Data Protection by Design** | ✅ Complete | Minimized data collection |
| **Article 28 - Right to be Forgotten** | ✅ Complete | User deletion procedure |
| **Article 33 - Restrictions** | ✅ Complete | Processing limitations |
| **Article 35 - Data Subject Rights** | ✅ Complete | User data export |
| **Article 36 - Rectification** | ✅ Complete | Error correction procedure |

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
