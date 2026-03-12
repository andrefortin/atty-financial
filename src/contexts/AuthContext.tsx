/**
 * Auth Context
 *
 * Provides authentication state management and functions
 * for the entire application.
 *
 * Features:
 * - Auth state management
 * - Login function
 * - Register function
 * - Logout function
 * - Password reset function
 * - Profile update function
 * - Role-based access checks
 * - Loading states and error handling
 * - Real-time auth state changes
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { getFirebaseAuth, convertFirebaseError } from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================
// Types
// ============================================

export type UserRole = 'Admin' | 'User' | 'Viewer';

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  firmId?: string;
}

export interface AuthContextValue {
  // State
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Functions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================
// Provider Props
// ============================================

interface AuthProviderProps {
  children: ReactNode;
  onAuthChange?: (user: AuthUser | null) => void;
  onAuthError?: (error: string) => void;
}

// ============================================
// Provider Component
// ============================================

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onAuthChange,
  onAuthError,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Firebase Auth instance
  const auth = getFirebaseAuth();

  // Check if user has required role
  const checkRole = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.role === requiredRole;
  }, [user]);

  // Check if user is admin
  const isAdmin = useMemo(() => checkRole('Admin'), [user, checkRole]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;
      const authUser = await convertFirebaseUser(firebaseUser);

      setUser(authUser);
      onAuthChange?.(authUser);
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      const errorMessage = firebaseError.message;
      setError(errorMessage);
      onAuthError?.(errorMessage);
      throw firebaseError;
    } finally {
      setLoading(false);
    }
  }, [auth, onAuthChange, onAuthError]);

  // Register function
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole = 'User'
    ): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const userCredential: UserCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update profile with display name
        if (displayName) {
          await updateProfile(userCredential.user, {
            displayName,
          });
        }

        // Note: In a real application, you would set the user's role
        // in Firestore after creation and update the auth user with
        // custom claims. For now, we'll use a simple role assignment.
        const authUser = await convertFirebaseUser(userCredential.user, role);

        setUser(authUser);
        onAuthChange?.(authUser);
      } catch (error) {
        const firebaseError = convertFirebaseError(error);
        const errorMessage = firebaseError.message;
        setError(errorMessage);
        onAuthError?.(errorMessage);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [auth, onAuthChange, onAuthError]
  );

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await firebaseSignOut(auth);
      setUser(null);
      onAuthChange?.(null);
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      const errorMessage = firebaseError.message;
      setError(errorMessage);
      onAuthError?.(errorMessage);
      throw firebaseError;
    } finally {
      setLoading(false);
    }
  }, [auth, onAuthChange, onAuthError]);

  // Password reset function
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      const errorMessage = firebaseError.message;
      setError(errorMessage);
      onAuthError?.(errorMessage);
      throw firebaseError;
    } finally {
      setLoading(false);
    }
  }, [auth, onAuthError]);

  // Update profile function
  const updateProfile = useCallback(
    async (displayName: string, photoURL?: string): Promise<void> => {
      if (!user) {
        throw new Error('No user is currently logged in');
      }

      try {
        setLoading(true);
        setError(null);

        await updateProfile(user, {
          displayName,
          photoURL,
        });

        // Update local user state
        setUser({
          ...user,
          displayName,
          photoURL,
        });

        onAuthChange?.(user);
      } catch (error) {
        const firebaseError = convertFirebaseError(error);
        const errorMessage = firebaseError.message;
        setError(errorMessage);
        onAuthError?.(errorMessage);
        throw firebaseError;
      } finally {
        setLoading(false);
      }
    },
    [user, onAuthChange, onAuthError]
  );

  // Check auth function (refresh user state)
  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // If user is already set, no need to check
      if (user) {
        setLoading(false);
        return;
      }

      // Wait for Firebase to initialize
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      // The onAuthStateChanged listener will handle this
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      const errorMessage = firebaseError.message;
      setError(errorMessage);
      onAuthError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, auth, onAuthError]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Convert Firebase user to AuthUser
  const convertFirebaseUser = useCallback(
    async (firebaseUser: FirebaseUser, role: UserRole = 'User'): Promise<AuthUser> => {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        role,
        createdAt: firebaseUser.metadata.createdAt
          ? new Date(firebaseUser.metadata.createdAt)
          : new Date(),
        firmId: undefined, // TODO: Fetch from Firestore
      };
    },
    []
  );

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // In a real application, you would fetch the user's role from Firestore
          // For now, we'll use a simple role assignment
          const role: UserRole = 'User'; // TODO: Fetch from Firestore
          const authUser = await convertFirebaseUser(firebaseUser, role);
          setUser(authUser);
          onAuthChange?.(authUser);
        } else {
          setUser(null);
          onAuthChange?.(null);
        }
      } catch (error) {
        const firebaseError = convertFirebaseError(error);
        const errorMessage = firebaseError.message;
        setError(errorMessage);
        onAuthError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, onAuthChange, onAuthError, convertFirebaseUser]);

  // Value object
  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      isAdmin,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      checkAuth,
      clearError,
    }),
    [
      user,
      loading,
      error,
      isAdmin,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      checkAuth,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Custom Hook
// ============================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// Role-based Access Control Hooks
// ============================================

export const useAuthCheck = (role: UserRole): boolean => {
  const { isAdmin, user } = useAuth();
  if (role === 'Admin') return isAdmin;
  return user?.role === role;
};

export const useRequireAuth = (): { authenticated: boolean; loading: boolean } => {
  const { isAuthenticated, loading } = useAuth();
  return { authenticated: isAuthenticated, loading };
};

export const useRequireAdmin = (): { admin: boolean; loading: boolean } => {
  const { isAdmin, loading } = useAuth();
  return { admin: isAdmin, loading };
};

// ============================================
// Export
// ============================================

export default AuthContext;
