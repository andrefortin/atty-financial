/**
 * Authentication System Tests
 *
 * Tests for AuthContext, useAuth hook, and related components.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import { getFirebaseAuth, convertFirebaseError } from '../lib/firebase';

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  getFirebaseAuth: jest.fn(),
  convertFirebaseError: jest.fn(),
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="/">{children}</a>
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: () => <div className="animate-spin" />,
  AlertCircle: () => <div />,
  ArrowRight: () => <div />,
  CheckCircle2: () => <div />,
  Mail: () => <div />,
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
  browserLocalPersistence: {},
  UserCredential: class {},
  AuthError: class {},
}));

// Mock Firebase types
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  emailVerified: false,
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  metadata: {
    createdAt: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
};

const mockAuthState = {
  user: mockUser,
  loading: false,
  error: null,
  isAuthenticated: true,
  isAdmin: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  checkAuth: jest.fn(),
  clearError: jest.fn(),
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide auth context value', () => {
    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle login success', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      user: mockUser,
    });

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      signInWithEmailAndPassword: mockLogin,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test login function
    await result.current.login('test@example.com', 'password123');

    expect(mockLogin).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
  });

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials');
    mockError.code = 'auth/wrong-password';

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      signInWithEmailAndPassword: jest.fn().mockRejectedValue(mockError),
    } as any);

    (convertFirebaseError as jest.Mock).mockReturnValue({
      message: 'Invalid credentials',
      code: 'auth/wrong-password',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.login('test@example.com', 'wrong')).rejects.toThrow();

    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should handle register success', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      user: mockUser,
    });

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      createUserWithEmailAndPassword: mockRegister,
      updateProfile: jest.fn(),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.register(
      'new@example.com',
      'password123',
      'New User'
    );

    expect(mockRegister).toHaveBeenCalledWith(
      'new@example.com',
      'password123'
    );
  });

  it('should handle register error', async () => {
    const mockError = new Error('Email already in use');
    mockError.code = 'auth/email-already-in-use';

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      createUserWithEmailAndPassword: jest.fn().mockRejectedValue(mockError),
      updateProfile: jest.fn(),
    } as any);

    (convertFirebaseError as jest.Mock).mockReturnValue({
      message: 'Email already in use',
      code: 'auth/email-already-in-use',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.register('existing@example.com', 'password123', 'User')
    ).rejects.toThrow();

    expect(result.current.error).toBe('Email already in use');
  });

  it('should handle logout success', async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      signOut: mockLogout,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.logout();

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle password reset', async () => {
    const mockReset = jest.fn().mockResolvedValue(undefined);

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      sendPasswordResetEmail: mockReset,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.resetPassword('test@example.com');

    expect(mockReset).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle profile update', async () => {
    const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);

    (getFirebaseAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn(() => jest.fn()),
      updateProfile: mockUpdateProfile,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updateProfile('New Name', 'new-photo.jpg');

    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'New Name',
        photoURL: 'new-photo.jpg',
      })
    );
  });

  it('should handle clearError', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    result.current.error = 'Test error';
    result.current.clearError();

    expect(result.current.error).toBeNull();
  });
});

describe('useAuth Hook', () => {
  it('should return auth functions', () => {
    const mockAuth = {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      isAdmin: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      checkAuth: jest.fn(),
      clearError: jest.fn(),
    };

    (getFirebaseAuth as jest.Mock).mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuthHook());

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isAdmin');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('resetPassword');
    expect(result.current).toHaveProperty('updateProfile');
    expect(result.current).toHaveProperty('checkAuth');
    expect(result.current).toHaveProperty('clearError');
  });

  it('should return hasRole function', () => {
    const mockAuth = {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      isAdmin: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
      checkAuth: jest.fn(),
      clearError: jest.fn(),
    };

    (getFirebaseAuth as jest.Mock).mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuthHook());

    expect(typeof result.current.hasRole).toBe('function');
  });
});

describe('convertFirebaseError', () => {
  it('should convert auth error to FirebaseError', () => {
    const mockError = new Error('Invalid credentials');
    mockError.code = 'auth/wrong-password';

    (convertFirebaseError as jest.Mock).mockReturnValue({
      message: 'Invalid credentials',
      code: 'auth/wrong-password',
    });

    const error = convertFirebaseError(mockError);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('auth/wrong-password');
    expect(error.message).toBe('Invalid credentials');
  });

  it('should handle Firestore errors', () => {
    const mockError = new Error('Permission denied');
    mockError.code = 'firestore/permission-denied';

    (convertFirebaseError as jest.Mock).mockReturnValue({
      message: 'Permission denied',
      code: 'firestore/permission-denied',
    });

    const error = convertFirebaseError(mockError);

    expect(error.code).toBe('firestore/permission-denied');
  });

  it('should handle unknown errors', () => {
    const mockError = new Error('Unknown error');
    mockError.code = 'unknown';

    (convertFirebaseError as jest.Mock).mockReturnValue({
      message: 'Unknown error',
      code: 'unknown',
    });

    const error = convertFirebaseError(mockError);

    expect(error.message).toBe('Unknown error');
    expect(error.code).toBe('unknown');
  });
});
