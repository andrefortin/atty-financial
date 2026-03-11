import React, { memo } from 'react';
import { Transaction } from '../../types';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';

interface OptimizedTransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showAllocations?: boolean;
}

export const OptimizedTransactionRow = memo<OptimizedTransactionRowProps>(({
  transaction,
  isSelected,
  onSelect,
  showAllocations = false,
}) => {
  const handleClick = () => onSelect(transaction.id);

  const isCredit = transaction.amount > 0;
  const amountColor = isCredit ? 'text-green-600' : 'text-red-600';

  return (
    <tr
      className={cn(
        'cursor-pointer transition-colors',
        isSelected ? 'bg-black/10' : 'hover:bg-gray-50'
      )}
      onClick={handleClick}
    >
      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
        {transaction.id}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {transaction.type}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {transaction.category}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium">
        <span className={amountColor}>
          {isCredit ? '+' : ''}{formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          {
            'bg-yellow-100 text-yellow-800': transaction.status === 'Unassigned',
            'bg-blue-100 text-blue-800': transaction.status === 'Assigned',
            'bg-green-100 text-green-800': transaction.status === 'Allocated',
          }
        )}>
          {transaction.status}
        </span>
      </td>
      {showAllocations && (
        <td className="px-4 py-3 text-sm text-gray-600">
          {transaction.allocations.length > 0 ? (
            <div className="space-y-1">
              {transaction.allocations.map((alloc, idx) => (
                <div key={idx} className="text-xs">
                  {alloc.matterName}: {formatCurrency(alloc.amount)}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.status === nextProps.transaction.status &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showAllocations === nextProps.showAllocations
  );
});

OptimizedTransactionRow.displayName = 'OptimizedTransactionRow';
