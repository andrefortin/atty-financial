// Transaction Store - Zustand state management for transactions
// Handles CRUD operations, allocations, filtering, sorting, pagination, and computed state

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  CreateTransactionInput,
} from '../types';
import { mockTransactions } from '../data/mockTransactions';

// ============================================
// Filter and Sort Types
// ============================================

export interface TransactionFilters {
  type?: TransactionType | 'All';
  status?: TransactionStatus | 'All';
  matterId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  searchQuery?: string;
}

export interface TransactionSorting {
  field: 'date' | 'type' | 'category' | 'amount' | 'status';
  direction: 'asc' | 'desc';
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
}

// ============================================
// State Interface
// ============================================

export interface TransactionState {
  // Data
  transactions: Transaction[];
  selectedTransactionId: string | null;

  // Filter/Sort/Pagination state
  filters: TransactionFilters;
  sorting: TransactionSorting;
  pagination: TransactionPagination;

  // Computed (getters)
  getFilteredTransactions: () => Transaction[];
  getSortedTransactions: () => Transaction[];
  getPaginatedTransactions: () => Transaction[];
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByMatterId: (matterId: string) => Transaction[];
  getUnassignedTransactions: () => Transaction[];
  getAssignedTransactions: () => Transaction[];
  getAllocatedTransactions: () => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
  getDrawTransactions: () => Transaction[];
  getPaymentTransactions: () => Transaction[];
  getAutodraftTransactions: () => Transaction[];
  getSelectedTransaction: () => Transaction | undefined;
  getTotalDraws: () => number;
  getTotalPrincipalPayments: () => number;
  getTotalInterestPaid: () => number;
  getFilteredCount: () => number;
  getTotalPages: () => number;
  getMatterTotalDraws: (matterId: string) => number;
  getMatterTotalPayments: (matterId: string) => number;
  getMatterTotalInterestPaid: (matterId: string) => number;

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  setSelectedTransactionId: (id: string | null) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  setSorting: (sorting: Partial<TransactionSorting>) => void;
  setPagination: (pagination: Partial<TransactionPagination>) => void;
  resetFilters: () => void;
  resetSorting: () => void;

  // CRUD Operations
  createTransaction: (input: CreateTransactionInput) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Allocation Actions
  allocateTransaction: (
    transactionId: string,
    allocations: Array<{ matterId: string; matterName: string; amount: number }>
  ) => void;
  unallocateTransaction: (transactionId: string) => void;
  updateAllocation: (
    transactionId: string,
    allocations: Array<{ matterId: string; matterName: string; amount: number }>
  ) => void;

  // Bulk operations
  bulkDeleteTransactions: (ids: string[]) => void;
  bulkAllocate: (
    transactionIds: string[],
    allocations: Array<{ matterId: string; matterName: string; amount: number }>
  ) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialFilters: TransactionFilters = {
  type: 'All',
  status: 'All',
  searchQuery: '',
};

const initialSorting: TransactionSorting = {
  field: 'date',
  direction: 'desc',
};

const initialPagination: TransactionPagination = {
  page: 1,
  pageSize: 10,
};

// ============================================
// Store Definition
// ============================================

export const useTransactionStore = create<TransactionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial data
        transactions: mockTransactions,
        selectedTransactionId: null,
        filters: initialFilters,
        sorting: initialSorting,
        pagination: initialPagination,

        // ============================================
        // Getters / Computed State
        // ============================================

        getFilteredTransactions: () => {
          const { transactions, filters } = get();
          return transactions.filter((transaction) => {
            // Type filter
            if (filters.type && filters.type !== 'All' && transaction.type !== filters.type) {
              return false;
            }

            // Status filter
            if (filters.status && filters.status !== 'All' && transaction.status !== filters.status) {
              return false;
            }

            // Matter filter
            if (filters.matterId) {
              const hasMatterAllocation = transaction.allocations.some(
                (a) => a.matterId === filters.matterId
              );
              if (!hasMatterAllocation) return false;
            }

            // Date range filter
            if (filters.dateFrom && transaction.date < filters.dateFrom) {
              return false;
            }
            if (filters.dateTo && transaction.date > filters.dateTo) {
              return false;
            }

            // Category filter
            if (filters.category && transaction.category !== filters.category) {
              return false;
            }

            // Search query filter
            if (filters.searchQuery) {
              const query = filters.searchQuery.toLowerCase();
              const matchesSearch =
                transaction.id.toLowerCase().includes(query) ||
                (transaction.description && transaction.description.toLowerCase().includes(query)) ||
                transaction.category.toLowerCase().includes(query);
              if (!matchesSearch) return false;
            }

            return true;
          });
        },

        getSortedTransactions: () => {
          const filtered = get().getFilteredTransactions();
          const { field, direction } = get().sorting;

          return [...filtered].sort((a, b) => {
            let comparison = 0;

            switch (field) {
              case 'date':
                comparison = a.date.getTime() - b.date.getTime();
                break;
              case 'type':
                comparison = a.type.localeCompare(b.type);
                break;
              case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
              case 'amount':
                comparison = Math.abs(a.amount) - Math.abs(b.amount);
                break;
              case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            }

            return direction === 'asc' ? comparison : -comparison;
          });
        },

        getPaginatedTransactions: () => {
          const sorted = get().getSortedTransactions();
          const { page, pageSize } = get().pagination;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          return sorted.slice(start, end);
        },

        getTransactionById: (id) => {
          return get().transactions.find((t) => t.id === id);
        },

        getTransactionsByMatterId: (matterId) => {
          return get().transactions.filter((t) =>
            t.allocations.some((a) => a.matterId === matterId)
          );
        },

        getUnassignedTransactions: () => {
          return get().transactions.filter((t) => t.status === 'Unassigned');
        },

        getAssignedTransactions: () => {
          return get().transactions.filter((t) => t.status === 'Assigned');
        },

        getAllocatedTransactions: () => {
          return get().transactions.filter((t) => t.status === 'Allocated');
        },

        getTransactionsByType: (type) => {
          return get().transactions.filter((t) => t.type === type);
        },

        getRecentTransactions: (limit = 10) => {
          return [...get().transactions]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, limit);
        },

        getDrawTransactions: () => {
          return get().transactions.filter((t) => t.type === 'Draw');
        },

        getPaymentTransactions: () => {
          return get().transactions.filter((t) => t.type === 'Principal Payment');
        },

        getAutodraftTransactions: () => {
          return get().transactions.filter((t) => t.type === 'Interest Autodraft');
        },

        getSelectedTransaction: () => {
          const { selectedTransactionId, getTransactionById } = get();
          return selectedTransactionId ? getTransactionById(selectedTransactionId) : undefined;
        },

        getTotalDraws: () => {
          return get().transactions
            .filter((t) => t.type === 'Draw')
            .reduce((sum, t) => sum + t.amount, 0);
        },

        getTotalPrincipalPayments: () => {
          return get().transactions
            .filter((t) => t.type === 'Principal Payment')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        },

        getTotalInterestPaid: () => {
          return get().transactions
            .filter((t) => t.type === 'Interest Autodraft' && t.status === 'Allocated')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        },

        getFilteredCount: () => {
          return get().getFilteredTransactions().length;
        },

        getTotalPages: () => {
          const count = get().getFilteredCount();
          const pageSize = get().pagination.pageSize;
          return Math.ceil(count / pageSize);
        },

        getMatterTotalDraws: (matterId) => {
          return get().transactions
            .filter((t) => t.type === 'Draw')
            .reduce((sum, t) => {
              const allocation = t.allocations.find((a) => a.matterId === matterId);
              return sum + (allocation?.amount || 0);
            }, 0);
        },

        getMatterTotalPayments: (matterId) => {
          return get().transactions
            .filter((t) => t.type === 'Principal Payment')
            .reduce((sum, t) => {
              const allocation = t.allocations.find((a) => a.matterId === matterId);
              return sum + (allocation?.amount || 0);
            }, 0);
        },

        getMatterTotalInterestPaid: (matterId) => {
          return get().transactions
            .filter((t) => t.type === 'Interest Autodraft' && t.status === 'Allocated')
            .reduce((sum, t) => {
              const allocation = t.allocations.find((a) => a.matterId === matterId);
              return sum + (allocation?.amount || 0);
            }, 0);
        },

        // ============================================
        // Filter/Sort/Pagination Actions
        // ============================================

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
            pagination: { ...state.pagination, page: 1 }, // Reset to first page
          }));
        },

        setSorting: (sorting) => {
          set((state) => ({
            sorting: { ...state.sorting, ...sorting },
          }));
        },

        setPagination: (pagination) => {
          set((state) => ({
            pagination: { ...state.pagination, ...pagination },
          }));
        },

        resetFilters: () => {
          set({ filters: initialFilters, pagination: { ...initialPagination, page: 1 } });
        },

        resetSorting: () => {
          set({ sorting: initialSorting });
        },

        // ============================================
        // CRUD Actions
        // ============================================

        setSelectedTransactionId: (id) => {
          set({ selectedTransactionId: id });
        },

        setTransactions: (transactions) => {
          set({ transactions });
        },

        createTransaction: (input) => {
          // Generate transaction ID based on date and sequence
          const dateStr = input.date.toISOString().split('T')[0];
          const existingCount = get().transactions.filter((t) =>
            t.id.startsWith(`TXN-${dateStr}`)
          ).length;
          const sequence = String(existingCount + 1).padStart(3, '0');
          const id = `TXN-${dateStr}-${sequence}`;

          const netAmount =
            input.type === 'Principal Payment' || input.type === 'Interest Autodraft'
              ? -input.amount
              : input.amount;

          const newTransaction: Transaction = {
            id,
            date: input.date,
            type: input.type,
            category: input.category as any,
            amount: input.amount,
            netAmount,
            status: input.allocations.length > 0 ? 'Assigned' : 'Unassigned',
            description: input.description,
            createdAt: new Date(),
            allocations: input.allocations.map((a) => ({
              matterId: a.matterId,
              matterName: a.matterId, // Will be populated by component
              amount: a.amount,
            })),
          };

          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));

          return newTransaction;
        },

        updateTransaction: (id, updates) => {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? { ...transaction, ...updates } : transaction
            ),
          }));
        },

        deleteTransaction: (id) => {
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
            selectedTransactionId: state.selectedTransactionId === id ? null : state.selectedTransactionId,
          }));
        },

        // ============================================
        // Allocation Actions
        // ============================================

        allocateTransaction: (transactionId, allocations) => {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    allocations,
                    status: 'Assigned',
                  }
                : transaction
            ),
          }));
        },

        unallocateTransaction: (transactionId) => {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    allocations: [],
                    status: 'Unassigned',
                  }
                : transaction
            ),
          }));
        },

        updateAllocation: (transactionId, allocations) => {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    allocations,
                    status: allocations.length > 0 ? 'Assigned' : 'Unassigned',
                  }
                : transaction
            ),
          }));
        },

        // ============================================
        // Bulk Actions
        // ============================================

        bulkDeleteTransactions: (ids) => {
          set((state) => ({
            transactions: state.transactions.filter((t) => !ids.includes(t.id)),
            selectedTransactionId: ids.includes(state.selectedTransactionId || '')
              ? null
              : state.selectedTransactionId,
          }));
        },

        bulkAllocate: (transactionIds, allocations) => {
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transactionIds.includes(transaction.id)
                ? {
                    ...transaction,
                    allocations,
                    status: 'Assigned',
                  }
                : transaction
            ),
          }));
        },

        // ============================================
        // Reset
        // ============================================

        reset: () => {
          set({
            transactions: mockTransactions,
            selectedTransactionId: null,
            filters: initialFilters,
            sorting: initialSorting,
            pagination: initialPagination,
          });
        },
      }),
      {
        name: 'atty-transaction-storage',
        partialize: (state) => ({
          transactions: state.transactions,
          filters: state.filters,
          sorting: state.sorting,
        }),
      }
    ),
    { name: 'TransactionStore' }
  )
);
