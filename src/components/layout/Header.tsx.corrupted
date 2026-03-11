import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { NAVIGATION_ITEMS } from '../../utils/navigation';

export interface HeaderProps {
  children?: React.ReactNode;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage = 'dashboard',
  onPageChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = {
    name: 'John Smith',
    email: 'john.smith@smithlaw.com',
    avatar: 'JS',
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      LayoutDashboard: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 012-2h2a2 2 012 2v2a2 2 014 12H0c0 3.042 1.135 5.824 3.7.938l3-2.647z" />
        </svg>
      ),
      Briefcase: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2 2h-4a2 2 0 00-2 2v2a2 2 0 01-2 2V7a2 2 0 012 2h2a2 2 0 014 12H0c0 3.042 1.135 5.824 3.7.938l3-2.647z" />
        </svg>
      ),
      Receipt: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2H5a2 2 0 002 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 2 0 002 2V7a2 2 0 00-2 2v10a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2v14a2 2 0 002 2H7a2 2 0 002 2V7a2 2 0 00-2 2 attempts (limit 3/10)
