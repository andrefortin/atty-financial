import React from 'react';

interface TabProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onTabChange: (tabId: string) => void;
  badge?: number;
}

export const Tab: React.FC<TabProps> = ({ id, label, icon, isActive, onTabChange, badge }) => {
  const getIcon = () => {
    switch (icon) {
      case 'RefreshCw':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'History':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CheckCircle':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={() => onTabChange(id)}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
        ${isActive ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}
      `}
    >
      {getIcon()}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};
