import React, { useState, useMemo, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Button } from '../ui';
import { cn, formatCurrency } from '../../utils/formatters';
import { useMatterStore, useTransactionStore, useUIStore } from '../../store';
import { Transaction, TransactionAllocation, TransactionType } from '../../types';

export interface AllocationModalProps {
  isOpen: boolean;
  transaction?: Transaction;
  transactionAmount?: number;
  transactionId?: string;
  onSave: (allocations: TransactionAllocation[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  transaction,
  transactionAmount,
  transactionId,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const getMatterById = useMatterStore((state) => state.getMatterById);
  const getActiveMatters = useMatterStore((state) => state.getActiveMatters);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  const [allocations, setAllocations] = useState<TransactionAllocation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load transaction data when modal opens
  useEffect(() => {
    if (isOpen) {
      let txn: Transaction | undefined;
      let amount = 0;

      if (transaction) {
        txn = transaction;
        amount = transaction.amount;
      } else if (transactionId) {
        // This would come from the store in real app
        // For now, use the provided amount
        amount = transactionAmount || 0;
      }

      if (txn) {
        setAllocations(txn.allocations);
      } else {
        setAllocations([]);
      }
    }
  }, [isOpen, transaction, transactionId, transactionAmount]);

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, a) => sum + a.amount, 0),
    [allocations]
  );

  const remainingAmount = useMemo(
    () => {
      const amount = transaction?.amount || transactionAmount || 0;
      return Math.max(0, amount - totalAllocated);
    },
    [allocations, transaction, transactionAmount]
  );

  const isFullyAllocated = useMemo(
    () => remainingAmount === 0,
    [remainingAmount]
  );

  const hasErrors = Object.keys(errors).length > 0;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = transaction?.amount || transactionAmount || 0;

    if (allocations.length === 0) {
      newErrors.allocations = 'Please allocate to at least one matter';
    } else if (totalAllocated > amount) {
      newErrors.total = `Allocated amount (${formatCurrency(totalAllocated)}) exceeds transaction amount (${formatCurrency(amount)})`;
    } else if (totalAllocated < amount && !isFullyAllocated && !hasErrors) {
      newErrors.total = `Please allocate the full transaction amount. ${formatCurrency(remainingAmount)} remaining.`;
    }

    allocations.forEach((alloc, index) => {
      if (alloc.amount <= 0) {
        newErrors[`allocation-${index}`] = 'Amount must be greater than 0';
      }
      if (alloc.amount > remainingAmount + totalAllocated - alloc.amount) {
        newErrors[`allocation-${index}`] = 'Amount exceeds remaining balance';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAllocation = () => {
    const matterId = prompt('Enter Matter ID (e.g., JON-2024-001):');
    if (!matterId) return;

    const matter = getMatterById(matterId);
    if (!matter) {
      showError('Error', `Matter ${matterId} not found`);
      return;
    }

    const existingAllocation = allocations.find((a) => a.matterId === matterId);
    if (existingAllocation) {
      showError('Error', 'This matter is already allocated');
      return;
    }

    setAllocations([...allocations, {
      matterId,
      matterName: matter.clientName,
      amount: remainingAmount,
    }]);
  };

  const handleRemoveAllocation = (matterId: string) => {
    setAllocations(allocations.filter((a) => a.matterId !== matterId));
    // Clear errors when removing
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith('allocation-')) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const handleUpdateAllocation = (matterId: string, amount: number) => {
    setAllocations(
      allocations.map((alloc) =>
        alloc.matterId === matterId ? { ...alloc, amount } : alloc
      )
    );
  };

  const handleDistributeEvenly = () => {
    const amount = transaction?.amount || transactionAmount || 0;
    const activeMatters = getActiveMatters();

    if (activeMatters.length === 0) {
      showError('Error', 'No active matters available for allocation');
      return;
    }

    const perMatterAmount = Math.floor(amount / activeMatters.length);

    const newAllocations: TransactionAllocation[] = activeMatters.map((matter) => ({
      matterId: matter.id,
      matterName: matter.clientName,
      amount: perMatterAmount,
    }));

    setAllocations(newAllocations);
    setErrors({});
  };

  const handleDistributeProRata = () => {
    const amount = transaction?.amount || transactionAmount || 0;
    const activeMatters = getActiveMatters();

    if (activeMatters.length === 0) {
      showError('Error', 'No active matters available for allocation');
      return;
    }

    const totalPrincipalBalance = activeMatters.reduce((sum, m) => sum + m.principalBalance, 0);

    if (totalPrincipalBalance === 0) {
      showError('Error', 'No principal balance available for pro rata distribution');
      return;
    }

    const newAllocations: TransactionAllocation[] = activeMatters.map((matter) => ({
      matterId: matter.id,
      matterName: matter.clientName,
      amount: Math.round(amount * (matter.principalBalance / totalPrincipalBalance)),
    }));

    setAllocations(newAllocations);
    setErrors({});
  };

  const handleClearAll = () => {
    setAllocations([]);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave(allocations);
  };

  const activeMatters = getActiveMatters();
  const availableMatters = activeMatters.filter(
    (m) => !allocations.find((a) => a.matterId === m.id)
  );

  if (!isOpen) return null;

  const transactionAmountDisplay = transaction?.amount || transactionAmount || 0;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="xl" title="Allocate Transaction">
      <ModalBody>
        <div className="space-y-6">
          {/* Transaction Amount Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Amount
                </p>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(transactionAmountDisplay)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </p>
                <p className={cn(
                  'text-lg font-bold',
                  isFullyAllocated ? 'text-success' : 'text-black'
                )}>
                  {formatCurrency(totalAllocated)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </p>
                <p className={cn(
                  'text-lg font-bold',
                  remainingAmount === 0 ? 'text-success' : 'text-error'
                )}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>

            {isFullyAllocated && (
              <div className="mt-2 text-center">
                <p className="text-sm text-success font-medium">
                  ✓ Transaction fully allocated
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {availableMatters.length > 0 && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleDistributeEvenly}>
                Distribute Evenly
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDistributeProRata}>
                Distribute Pro Rata
              </Button>
              {allocations.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleAddAllocation}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-2H4m2 2h8m-2 2v-2m0 2h-2" />
                  </svg>
                  Add Matter
                </Button>
              )}
              {allocations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Allocations List */}
          {allocations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Allocated Matters
              </h3>
              <div className="space-y-3">
                {allocations.map((allocation, index) => {
                  const matter = getMatterById(allocation.matterId);
                  const error = errors[`allocation-${index}`];
                  const allocationError = errors.total;

                  return (
                    <div
                      key={allocation.matterId}
                      className={cn(
                        'p-4 border rounded-lg',
                        error
                          ? 'border-error bg-red-50'
                          : allocationError
                          ? 'border-warning bg-yellow-50'
                          : 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {allocation.matterName}
                            </p>
                            <p className="text-xs text-gray-500">{allocation.matterId}</p>
                          </div>
                          {matter && (
                            <div className="text-xs text-gray-600">
                              <p>Principal Balance: {formatCurrency(matter.principalBalance)}</p>
                              <p>Status: {matter.status}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={allocation.amount}
                            onChange={(e) => handleUpdateAllocation(allocation.matterId, parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0.01"
                            max={remainingAmount + allocation.amount}
                            className="w-32"
                            error={error}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveAllocation(allocation.matterId)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {availableMatters.length === 0 && allocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No active matters available for allocation</p>
              <p className="text-xs text-gray-400 mt-1">
                Create matters first or check status filters
              </p>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isFullyAllocated || hasErrors}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Allocation'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AllocationModal;
