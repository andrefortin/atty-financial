/**
 * Auth Hook
 *
 * Convenience hook for accessing authentication functions
 * and state throughout the application.
 *
 * @module hooks/useAuth
 */

import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Auth hook for accessing authentication state and functions
 *
 * @example
 * ```tsx
 * const { user, login, logout } = useAuth();
 *
 * if (!user) {
 *   return <Login />;
 * }
 *
 * return <Dashboard />;
 * ```
 */
export const useAuth = () => {
  const auth = useAuthContext();

  return {
    // State
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,

    // Functions
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    resetPassword: auth.resetPassword,
    updateProfile: auth.updateProfile,
    checkAuth: auth.checkAuth,
    clearError: auth.clearError,

    // Role-based access
    hasRole: (role: 'Admin' | 'User' | 'Viewer') => {
      if (role === 'Admin') return auth.isAdmin;
      return auth.user?.role === role;
    },
  };
};

/**
 * Hook to check if user has a specific role
 *
 * @example
 * ```tsx
 * const canEdit = useHasRole('Admin');
 * if (!canEdit) {
 *   return <AccessDenied />;
 * }
 * ```
 */
export const useHasRole = (role: 'Admin' | 'User' | 'Viewer'): boolean => {
  const { isAdmin, user } = useAuth();
  if (role === 'Admin') return isAdmin;
  return user?.role === role;
};

/**
 * Hook to require authentication
 *
 * Returns `true` if user is authenticated, `false` if not.
 * Throws an error if user is not authenticated and loading is complete.
 *
 * @example
 * ```tsx
 * const { authenticated, loading } = useRequireAuth();
 *
 * if (loading) return <Loading />;
 * if (!authenticated) return <Login />;
 *
 * return <Dashboard />;
 * ```
 */
export const useRequireAuth = (): {
  authenticated: boolean;
  loading: boolean;
} => {
  const { isAuthenticated, loading } = useAuth();
  return { authenticated: isAuthenticated, loading };
};

/**
 * Hook to require admin role
 *
 * Returns `true` if user is admin, `false` if not.
 * Throws an error if user is not admin and loading is complete.
 *
 * @example
 * ```tsx
 * const { admin, loading } = useRequireAdmin();
 *
 * if (loading) return <Loading />;
 * if (!admin) return <AccessDenied />;
 *
 * return <AdminDashboard />;
 * ```
 */
export const useRequireAdmin = (): {
  admin: boolean;
  loading: boolean;
} => {
  const { isAdmin, loading } = useAuth();
  return { admin: isAdmin, loading };
};

/**
 * Hook to get current user
 *
 * @example
 * ```tsx
 * const user = useCurrentUser();
 * if (!user) return <Login />;
 * ```
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to get current user ID
 *
 * @example
 * ```tsx
 * const userId = useCurrentUserId();
 * ```
 */
export const useCurrentUserId = () => {
  const { user } = useAuth();
  return user?.uid;
};

/**
 * Hook to get current user email
 *
 * @example
 * ```tsx
 * const userEmail = useCurrentEmail();
 * ```
 */
export const useCurrentEmail = () => {
  const { user } = useAuth();
  return user?.email;
};

/**
 * Hook to get current user display name
 *
 * @example
 * ```tsx
 * const displayName = useCurrentDisplayName();
 * ```
 */
export const useCurrentDisplayName = () => {
  const { user } = useAuth();
  return user?.displayName;
};

export default useAuth;
