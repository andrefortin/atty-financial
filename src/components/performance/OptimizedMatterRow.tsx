import React, { memo } from 'react';
import { Matter } from '../../types';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';

interface OptimizedMatterRowProps {
  matter: Matter;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

export const OptimizedMatterRow = memo<OptimizedMatterRowProps>(({
  matter,
  isSelected,
  onSelect,
  onEdit,
  showActions = true,
}) => {
  const handleClick = () => onSelect(matter.id);
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(matter.id);
  };

  return (
    <tr
      className={cn(
        'cursor-pointer transition-colors',
        isSelected ? 'bg-black/10' : 'hover:bg-gray-50'
      )}
      onClick={handleClick}
    >
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        {matter.caseNumber}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {matter.clientName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(matter.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
        {formatCurrency(matter.principalBalance)}
      </td>
      <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">
        {formatCurrency(matter.interestOwed)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
        {formatCurrency(matter.principalBalance + matter.interestOwed)}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          {
            'bg-green-100 text-green-800': matter.status === 'Active',
            'bg-gray-100 text-gray-800': matter.status === 'Closed',
            'bg-yellow-100 text-yellow-800': matter.status === 'Archive',
          }
        )}>
          {matter.status}
        </span>
      </td>
      {showActions && (
        <td className="px-4 py-3 text-sm text-gray-600">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 font-medium"
            aria-label={`Edit matter ${matter.clientName}`}
          >
            Edit
          </button>
        </td>
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.matter.id === nextProps.matter.id &&
    prevProps.matter.principalBalance === nextProps.matter.principalBalance &&
    prevProps.matter.interestOwed === nextProps.matter.interestOwed &&
    prevProps.matter.status === nextProps.matter.status &&
    prevProps.isSelected === nextProps.isSelected
  );
});

OptimizedMatterRow.displayName = 'OptimizedMatterRow';
