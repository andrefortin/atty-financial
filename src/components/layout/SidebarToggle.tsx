import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  collapsed,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${className}`}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? (
        <ChevronRight className="w-5 h-5" />
      ) : (
        <ChevronLeft className="w-5 h-5" />
      )}
    </button>
  );
};

export default SidebarToggle;
