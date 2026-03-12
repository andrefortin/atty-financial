/**
 * Protected Route Component
 *
 * Wraps routes to protect them based on authentication state.
 * Redirects unauthenticated users to the login page.
 *
 * Features:
 * - Route protection based on auth state
 * - Loading states while checking auth
 * - Redirect to login for unauthenticated users
 * - Support for role-based protection
 * - Error handling
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuth as useAuthHook } from '../hooks/useAuth';

// ============================================
// Types
// ============================================

export type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireRole?: 'Admin' | 'User' | 'Viewer';
};

// ============================================
// Component
// ============================================

/**
 * ProtectedRoute component
 *
 * @example
 * ```tsx
 * <ProtectedRoute requireAuth={true}>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requireAdmin={true}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireRole,
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">
            This page requires admin privileges.
          </p>
        </div>
      </div>
    );
  }

  // Role-based protection
  if (requireRole && requireRole !== 'Admin') {
    const userRole = (useAuthHook() as any)?.user?.role;
    if (userRole !== requireRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">
              This page requires {requireRole} privileges.
            </p>
          </div>
        </div>
      );
    }
  }

  // Protected route
  return <>{children}</>;
};

// ============================================
// Export
// ============================================

export default ProtectedRoute;
