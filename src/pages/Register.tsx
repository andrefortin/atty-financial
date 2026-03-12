/**
 * Register Page
 *
 * User registration page with password validation,
 * role selection, and error handling.
 *
 * Features:
 * - Registration form
 * - Password validation
 * - Role selection
 * - Error handling
 * - Navigation to login
 * - Responsive design
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

// ============================================
// Types
// ============================================

interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'User' | 'Admin';
}

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// ============================================
// Component
// ============================================

/**
 * Register page component
 *
 * @example
 * ```tsx
 * <Register />
 * ```
 */
export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

  const [values, setValues] = useState<RegisterFormValues>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update password validation when password changes
    if (name === 'password') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords match
    if (values.password !== values.confirmPassword) {
      return;
    }

    // Validate password requirements
    if (!passwordValidation.minLength || !passwordValidation.hasNumber || !passwordValidation.hasSpecialChar) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register(values.email, values.password, values.displayName, values.role);
      // Navigate to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600">
            Get started with ATTY Financial today
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

        {/* Register form */}
        <form className="bg-white shadow rounded-lg p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Display name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              required
              value={values.displayName}
              onChange={handleChange}
              disabled={loading || isSubmitting}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="John Doe"
            />
          </div>

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
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          {/* Role selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={handleChange}
              disabled={loading || isSubmitting}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="User">Standard User</option>
              <option value="Admin">Administrator</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {values.role === 'User'
                ? 'Full access to all features'
                : 'Full access with administrative privileges'}
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              value={values.password}
              onChange={handleChange}
              disabled={loading || isSubmitting}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="••••••••"
            />
            {/* Password validation */}
            {values.password && (
              <div className="mt-2 space-y-1">
                <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`h-3 w-3 mr-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`h-3 w-3 mr-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>Contains a number</span>
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`h-3 w-3 mr-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>Contains a special character</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={values.confirmPassword}
              onChange={handleChange}
              disabled={loading || isSubmitting}
              className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                values.password !== values.confirmPassword && values.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : ''
              }`}
              placeholder="••••••••"
            />
            {values.password !== values.confirmPassword && values.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                Passwords do not match
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
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

export default Register;
