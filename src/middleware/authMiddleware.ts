/**
 * Auth Middleware
 *
 * Middleware for protecting API routes and ensuring
 * proper authentication and authorization.
 *
 * @module middleware/authMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../utils/security';
import { getFirebaseAuth } from '../lib/firebase';

// ============================================
// Types
// ============================================

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    role: 'Admin' | 'User' | 'Viewer';
  };
  token?: string;
}

// ============================================
// Authentication Middleware
// ============================================

/**
 * Require authentication middleware
 *
 * Ensures the request is authenticated
 *
 * @example
 * ```typescript
 * app.get('/protected', requireAuth, (req, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is in session
    if (!req.session?.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if session token is valid
    if (req.session?.token) {
      const isValid = verifySessionToken(req.session.token, req.session.tokenData);
      if (!isValid.valid) {
        res.status(401).json({
          success: false,
          error: isValid.error || 'Invalid session token',
        });
        return;
      }
    }

    // If using Firebase, verify Firebase token
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const token = authHeader.replace('Bearer ', '');

      try {
        const auth = getFirebaseAuth();
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name,
          role: decodedToken.role || 'User',
        };
        req.token = token;
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Invalid Firebase token',
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Require specific role middleware
 *
 * Ensures the authenticated user has the required role
 *
 * @param role - Required role
 *
 * @example
 * ```typescript
 * app.get('/admin', requireRole('Admin'), (req, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export const requireRole = (role: 'Admin' | 'User' | 'Viewer') => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== role && req.user.role !== 'Admin') {
    res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${role}`,
    });
    return;
  }

  next();
};

/**
 * Require admin middleware
 *
 * Ensures the authenticated user is an admin
 *
 * @example
 * ```typescript
 * app.delete('/admin/users/:id', requireAdmin, (req, res) => {
 *   res.json({ success: true });
 * });
 * ```
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'Admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
};

/**
 * Require authenticated user middleware
 *
 * Ensures the authenticated user belongs to a specific firm
 *
 * @param firmId - Required firm ID
 *
 * @example
 * ```typescript
 * app.get('/firm/:firmId/dashboard', requireFirmAccess(firmId), (req, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export const requireFirmAccess = (firmId: string) => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.firmId !== firmId && req.user.role !== 'Admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied. You do not have access to this firm',
    });
    return;
  }

  next();
};

// ============================================
// CSRF Protection Middleware
// ============================================

/**
 * Validate CSRF token middleware
 *
 * Ensures the request includes a valid CSRF token
 *
 * @example
 * ```typescript
 * app.post('/api/protected', validateCSRF, (req, res) => {
 *   res.json({ success: true });
 * });
 * ```
 */
export const validateCSRF = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check if CSRF is required (not for GET requests)
  if (req.method === 'GET' || req.method === 'HEAD') {
    next();
    return;
  }

  // Check if CSRF token is provided
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

  if (!csrfToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token required',
    });
    return;
  }

  // Check if token is valid
  const isValid = verifyCSRFToken(
    csrfToken,
    req.session?.csrfToken || {}
  );

  if (!isValid.valid) {
    res.status(403).json({
      success: false,
      error: isValid.error || 'Invalid CSRF token',
    });
    return;
  }

  next();
};

// ============================================
// Rate Limiting Middleware
// ============================================

/**
 * Rate limiting middleware
 *
 * Limits the number of requests from a single IP address
 *
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 *
 * @example
 * ```typescript
 * app.post('/api/login', rateLimit(10, 60000), (req, res) => {
 *   res.json({ success: true });
 * });
 * ```
 */
export const rateLimit = (
  maxRequests: number,
  windowMs: number
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now > record.resetTime) {
      // New window or first request
      requests.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    record.count++;
    next();
  };
};

// ============================================
// Request Validation Middleware
// ============================================

/**
 * Validate request body middleware
 *
 * Validates the request body against a schema
 *
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * app.post('/api/matters', validateBody(matterSchema), (req, res) => {
 *   res.json({ success: true });
 * });
 * ```
 */
export const validateBody = (schema: any) => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const errors: string[] = [];

    // Validate each field in schema
    for (const field in schema) {
      const required = schema[field];
      const value = req.body[field];

      if (required && (value === undefined || value === null)) {
        errors.push(`Missing required field: ${field}`);
      }

      if (required && typeof value !== required) {
        errors.push(`Invalid type for field ${field}. Expected ${required}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errors,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation error',
    });
  }
};

// ============================================
// Export
// ============================================

export type { AuthRequest };
