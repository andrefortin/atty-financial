/**
 * Settings Page
 *
 * User profile management page with password change,
 * profile update, and account settings.
 *
 * Features:
 * - Profile update
 * - Password change
 * - Account settings
 * - Error handling
 * - Loading states
 * - Responsive design
 */

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Key, User, Mail, Shield, Trash2 } from 'lucide-react';

// ============================================
// Types
// ============================================

interface ProfileUpdateFormValues {
  displayName: string;
  photoURL?: string;
}

interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// Component
// ============================================

/**
 * Settings page component
 *
 * @example
 * ```tsx
 * <Settings />
 * ```
 */
export const Settings: React.FC = () => {
  const { user, updateProfile, loading, error, clearError } = useAuth();

  // Profile form state
  const [profileValues, setProfileValues] = useState<ProfileUpdateFormValues>({
    displayName: user?.displayName || '',
    photoURL: '',
  });

  // Password form state
  const [passwordValues, setPasswordValues] = useState<PasswordChangeFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Update profile form state when user changes
  React.useEffect(() => {
    if (user) {
      setProfileValues({
        displayName: user.displayName || '',
        photoURL: '',
      });
    }
  }, [user]);

  // Clear error on unmount
  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleProfileUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return;

    setProfileLoading(true);
    setProfileSuccess(false);

    try {
      await updateProfile(profileValues.displayName, profileValues.photoURL || undefined);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password requirements
    if (passwordValues.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    // Validate current password is not empty
    if (!passwordValues.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // Note: This is a simplified implementation
      // In a real app, you would need to implement password change
      // with Firebase Auth's signInWithCredential
      console.log('Password change:', passwordValues);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
      setPasswordValues({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Settings
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={profileValues.displayName}
                onChange={(e) =>
                  setProfileValues((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                disabled={loading || profileLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Your name"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                id="photoURL"
                name="photoURL"
                value={profileValues.photoURL}
                onChange={(e) =>
                  setProfileValues((prev) => ({
                    ...prev,
                    photoURL: e.target.value,
                  }))
                }
                disabled={loading || profileLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="https://example.com/photo.jpg"
              />
              {profileSuccess && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Profile updated successfully
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={loading || profileLoading}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Password Settings
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordValues.currentPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                disabled={loading || passwordLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordValues.newPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                disabled={loading || passwordLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordValues.confirmPassword}
                onChange={(e) =>
                  setPasswordValues((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                disabled={loading || passwordLoading}
                className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                  passwordError && passwordValues.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                placeholder="••••••••"
              />
              {passwordError && passwordValues.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={loading || passwordLoading}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Account Information
          </h2>

          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>

            {/* Email Verified */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Email Verified</span>
              <span className="text-sm font-medium">
                {user?.emailVerified ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Unverified
                  </span>
                )}
              </span>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Role</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.role === 'Admin' ? 'Administrator' : user?.role === 'User' ? 'User' : 'Viewer'}
              </span>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">User ID</span>
              <span className="text-sm font-mono text-gray-900">{user?.uid}</span>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Account Created</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Danger Zone
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <button
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Export
// ============================================

export default Settings;
