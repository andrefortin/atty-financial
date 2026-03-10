import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export interface HeaderProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
  isMobileDrawerOpen?: boolean;
  onMobileDrawerToggle?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage = 'dashboard',
  onPageChange,
  isMobileDrawerOpen = false,
  onMobileDrawerToggle,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = {
    name: 'John Smith',
    email: 'john.smith@smithlaw.com',
    avatar: 'JS',
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[51] bg-white border-b border-gray-300 flex items-center justify-between px-4 h-16">
      {/* Left side - Mobile menu toggle and logo */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu - only show on mobile */}
        <button
          onClick={onMobileDrawerToggle}
          className="md:hidden flex items-center justify-center p-2 rounded-md transition-all duration-150 cursor-pointer border-none bg-transparent text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
          aria-expanded={isMobileDrawerOpen}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo - hidden on mobile, visible on tablet+ */}
        <div className="hidden md:block ml-2">
          <img src="/assets/logo-atty-financial-banner-dark.png" alt="ATTY Financial" className="h-8 w-auto" />
        </div>
      </div>

      {/* Right side - User controls */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative flex items-center justify-center p-2 rounded-md transition-all duration-150 cursor-pointer border-none bg-transparent text-gray-600 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Help - hidden on mobile */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-gray-600 transition-all duration-150 cursor-pointer border-none bg-transparent hover:text-blue-600 hover:bg-gray-100">
          <HelpCircle className="w-4 h-4" />
          Help
        </button>

        {/* User menu */}
        <div className="user-menu-container relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 border-l border-gray-300 pl-3 py-1 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            {/* User info - hidden on mobile */}
            <div className="hidden md:block text-right">
              <p className="font-medium text-sm text-gray-900 m-0 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-500 m-0 leading-tight">{user.email}</p>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white text-sm font-medium flex-shrink-0">
              {user.avatar}
            </div>
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[52]">
              {/* User info - mobile only */}
              <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="font-medium text-sm text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              {/* Profile link */}
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  setShowUserMenu(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </a>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
