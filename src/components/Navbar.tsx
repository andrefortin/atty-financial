/**
 * Navbar Component
 *
 * Navigation bar with authentication-aware menu items
 * and user dropdown menu.
 *
 * Features:
 * - Authentication-aware navigation
 * - User dropdown menu
 * - Role-based access control
 * - Responsive design
 * - Loading states
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  RefreshCw,
  Calculator,
  BarChart3,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

// ============================================
// Component
// ============================================

/**
 * Navbar component
 *
 * @example
 * ```tsx
 * <Navbar currentPage="dashboard" onPageChange={handlePageChange} />
 * ```
 */
export const Navbar: React.FC<{
  currentPage: string;
  onPageChange: (page: string) => void;
}> = ({ currentPage, onPageChange }) => {
  const { user, loading, logout, isAdmin } = useAuth();
  const { isAuthenticated } = useAuthHook();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      path: '/',
      requireAuth: true,
    },
    {
      id: 'matters',
      label: 'Matters',
      icon: <FileText className="h-4 w-4" />,
      path: '/matters',
      requireAuth: true,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <CreditCard className="h-4 w-4" />,
      path: '/transactions',
      requireAuth: true,
    },
    {
      id: 'bank-feed',
      label: 'Bank Feed',
      icon: <RefreshCw className="h-4 w-4" />,
      path: '/bank-feed',
      requireAuth: true,
    },
    {
      id: 'calculators',
      label: 'Calculators',
      icon: <Calculator className="h-4 w-4" />,
      path: '/calculators',
      requireAuth: true,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="h-4 w-4" />,
      path: '/reports',
      requireAuth: true,
    },
    {
      id: 'rate-calendar',
      label: 'Rate Calendar',
      icon: <Calendar className="h-4 w-4" />,
      path: '/rate-calendar',
      requireAuth: true,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="h-4 w-4" />,
      path: '/alerts',
      requireAuth: true,
    },
    {
      id: 'interest-allocation',
      label: 'Interest Allocation',
      icon: <Calculator className="h-4 w-4" />,
      path: '/interest-allocation',
      requireAuth: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      path: '/settings',
      requireAuth: true,
    },
  ];

  // Filter navigation items based on auth and role
  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.requireAdmin && !isAdmin) return false;
    return true;
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.displayName) return user?.email?.charAt(0).toUpperCase() || 'U';
    const parts = user.displayName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    return user?.displayName || user?.email || 'User';
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (user?.role === 'Admin') return 'Administrator';
    if (user?.role === 'User') return 'User';
    return 'Viewer';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Link
              to="/"
              className="flex items-center ml-2"
              onClick={() => {
                onPageChange('dashboard');
                setIsMenuOpen(false);
              }}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  ATTY Financial
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  navigate(item.path);
                }}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {/* User dropdown menu */}
            {isAuthenticated && !loading && (
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {getUserInitials()}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                  </button>
                </div>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm text-gray-900 font-medium">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {getUserRoleDisplay()}
                      </p>
                    </div>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 inline-block mr-2" />
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 inline-block mr-2" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 inline-block mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center ml-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  navigate(item.path);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// ============================================
// Export
// ============================================

export default Navbar;
