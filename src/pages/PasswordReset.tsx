/**
 * Password Reset Page
 *
 * Email input page for password reset with success message
 * and error handling.
 *
 * Features:
 * - Email input for password reset
 * - Success message
 * - Error handling
 * - Navigation to login
 * - Responsive design
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Mail } from 'lucide-react';

// ============================================
// Types
// ============================================

interface PasswordResetFormValues {
  email: string;
}

// ============================================
// Component
// ============================================

/**
 * Password reset page component
 *
 * @example
 * ```tsx
 * <PasswordReset />
 * ```
 */
export const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuth();

  const [values, setValues] = useState<PasswordResetFormValues>({
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
    setEmailError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    if (!values.email || !values.email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setEmailError(null);

    try {
      await resetPassword(values.email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Password reset error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Success message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-green-500 mb-4">
                <Mail className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent a password reset link to <strong>{values.email}</strong>.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email within a few minutes, check your spam folder.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Send another email
              </button>
            </div>
          </div>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign in
                <ArrowRight className="inline-block ml-1 h-4 w-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset your password
          </h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password reset form */}
        <form className="bg-white shadow rounded-lg p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={handleChange}
              disabled={loading || isSubmitting}
              className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="you@example.com"
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">
                {emailError}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
              <ArrowRight className="inline-block ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Export
// ============================================

export default PasswordReset;
