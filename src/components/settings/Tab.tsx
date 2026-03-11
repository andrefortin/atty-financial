import React from 'react';
import { cn } from '../../utils/formatters';

export interface TabProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onTabChange: (id: string) => void;
}

export const Tab: React.FC<TabProps> = ({
  id,
  label,
  icon,
  isActive,
  onTabChange,
}) => {
  return (
    <button
      onClick={() => onTabChange(id)}
      className={cn(
        'flex-1 px-4 py-3 text-left font-medium text-sm rounded-lg transition-all',
        'hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-black',
        isActive
          ? 'bg-black text-white'
          : 'bg-white text-gray-700',
        'border-b-2',
        isActive ? 'border-black' : 'border-transparent'
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        )}
        <span>{label}</span>
      </div>
    </button>
  );
};
