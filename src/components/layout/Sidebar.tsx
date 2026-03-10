import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  Database,
  DollarSign,
  Calculator,
  FileText,
  PieChart,
  Settings,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../utils/formatters';
import { NAVIGATION_ITEMS, NavItem } from '../../utils/navigation';
import { SidebarToggle } from './SidebarToggle';

export interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobileDrawerOpen?: boolean;
  onMobileDrawerClose?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  Briefcase,
  Receipt,
  Database,
  DollarSign,
  Calculator,
  FileText,
  PieChart,
  Settings,
  AlertCircle,
  TrendingUp,
};

// Breakpoint constants
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isMobileDrawerOpen = false,
  onMobileDrawerClose,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.MOBILE) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.TABLET) {
        setScreenSize('tablet');
        // Auto-collapse on tablet
        setCollapsed(true);
      } else {
        setScreenSize('desktop');
        setCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleNavClick = (page: string) => {
    onPageChange(page);
    // Close mobile drawer after navigation
    if (screenSize === 'mobile' && onMobileDrawerClose) {
      onMobileDrawerClose();
    }
  };

  // Mobile: drawer overlay with backdrop
  if (screenSize === 'mobile') {
    return (
      <>
        {/* Backdrop overlay */}
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileDrawerClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={cn(
            'fixed left-0 top-16 bottom-0 bg-black text-white z-50 transition-transform duration-300 md:hidden',
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
            'w-64'
          )}
        >
          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1">
            {NAVIGATION_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                currentPage={currentPage}
                collapsed={false}
                onClick={() => handleNavClick(item.id)}
              />
            ))}
          </nav>

          {/* Footer Info */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-xs text-gray-400">ATTY Financial v1.0.0</p>
            <p className="text-xs text-gray-500 mt-0.5">© 2024 All rights reserved</p>
          </div>
        </aside>
      </>
    );
  }

  // Tablet and Desktop: collapsible sidebar
  const sidebarWidth = collapsed ? 'w-16' : 'w-64';
  const contentMargin = collapsed ? 'ml-16' : 'ml-64';

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 bg-black text-white z-40 transition-all duration-300',
          sidebarWidth
        )}
      >
        {/* Collapse Button - show on tablet+ */}
        <div className="flex justify-end p-4">
          <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              currentPage={currentPage}
              collapsed={collapsed}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>

        {/* Footer Info - only show when expanded */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-xs text-gray-400">ATTY Financial v1.0.0</p>
            <p className="text-xs text-gray-500 mt-0.5">© 2024 All rights reserved</p>
          </div>
        )}
      </aside>

      {/* Spacer to push main content */}
      <div className={contentMargin} aria-hidden="true" />
    </>
  );
};

// Sidebar navigation item component
interface SidebarNavItemProps {
  item: NavItem;
  currentPage: string;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  currentPage,
  collapsed,
  onClick,
}) => {
  const isActive = currentPage === item.id;
  const Icon = ICON_MAP[item.icon] || LayoutDashboard;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150',
        'text-sm font-medium relative',
        isActive
          ? 'bg-accent text-black'
          : 'text-gray-200 hover:bg-white/10 hover:text-white'
      )}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Badge - only show when not collapsed */}
      {item.badge && !collapsed && (
        <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
          {item.badge}
        </span>
      )}

      {/* Badge - collapsed version */}
      {item.badge && collapsed && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-medium">
          {item.badge}
        </span>
      )}
    </button>
  );
};

export default Sidebar;
