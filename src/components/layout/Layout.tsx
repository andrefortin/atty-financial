import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  onLogout,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleMobileDrawerToggle = () => {
    setIsMobileDrawerOpen(!isMobileDrawerOpen);
  };

  const handleMobileDrawerClose = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <Header
        currentPage={currentPage}
        onPageChange={onPageChange}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerToggle={handleMobileDrawerToggle}
        onLogout={onLogout}
      />

      {/* Sidebar - responsive behavior handled internally */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerClose={handleMobileDrawerClose}
      />

      {/* Main Content Area - with top padding to account for fixed header */}
      <main className="pt-16">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
