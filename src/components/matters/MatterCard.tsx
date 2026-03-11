import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { Matter } from '../../types';

export interface MatterCardProps {
  matter: Matter;
  onView: () => void;
  onEdit: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const MatterCard: React.FC<MatterCardProps> = ({
  matter,
  onView,
  onEdit,
  onClose,
  onDelete,
  className,
}) => {
  const isOverdue = (): boolean => {
    if (!matter.closedAt || matter.status !== 'Closed') return false;
    const now = new Date();
    const diff = now.getTime() - matter.closedAt.getTime();
    const daysSinceClosure = Math.floor(diff / (1000 * 60 * 60 * 24));
    return daysSinceClosure >= 20 && matter.principalBalance > 0;
  };

  const getDaysSinceClosure = (): string | null => {
    if (!matter.closedAt || matter.status !== 'Closed') return null;
    const now = new Date();
    const diff = now.getTime() - matter.closedAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days since closure`;
  };

  return (
    <Card hover onClick={onView} className={className}>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{matter.id}</CardTitle>
              <StatusBadge status={matter.status} />
            </div>
            <p className="text-lg font-medium text-gray-900">{matter.clientName}</p>
          </div>
          <div className="flex gap-1">
            <IconButton variant="ghost" size="sm" onClick={onEdit} title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </IconButton>
            {matter.status === 'Active' && onClose && (
              <IconButton variant="secondary" size="sm" onClick={onClose} title="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </IconButton>
            )}
            {matter.status === 'Closed' && onDelete && (
              <IconButton variant="danger" size="sm" onClick={onDelete} title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h4a1 1 0 00-1 1v3M4 7h16a2 2 0 002 2v14a2 2 0 00-2 2z" />
                </svg>
              </IconButton>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {matter.notes && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{matter.notes}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Principal Balance
            </p>
            <p className={cn(
              'text-lg font-semibold',
              matter.principalBalance > 0 ? 'text-error' : 'text-success'
            )}>
              {formatCurrency(matter.principalBalance)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Total Owed
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(matter.totalOwed)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Interest Accrued
            </p>
            <p className="text-lg font-semibold text-warning">
              {formatCurrency(matter.totalInterestAccrued)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Interest Paid
            </p>
            <p className="text-lg font-semibold text-success">
              {formatCurrency(matter.interestPaid)}
            </p>
          </div>
        </div>

        {matter.closedAt && (
          <div className={cn(
            'mt-4 p-3 rounded-lg border',
            isOverdue()
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          )}>
            <div className="flex items-center gap-2">
              {isOverdue() ? (
                <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 100 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Closed {formatDate(matter.closedAt)}
                </p>
                <p className="text-xs text-gray-600">
                  {getDaysSinceClosure()}
                  {isOverdue() && ' - Outstanding balance remains'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatterCard;
