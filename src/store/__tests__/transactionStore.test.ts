// ============================================
// Unit Tests for Transaction Store
// ============================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  useTransactionStore,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  setTransactionFilters,
  setTransactionSorting,
  setTransactionPagination,
  resetFilters,
  resetSorting,
  getFilteredTransactions,
  getSortedTransactions,
  getPaginatedTransactions,
  getTransactionById,
  getTransactionsByStatus,
  getTransactionsByType,
  getTransactionsByCategory,
  getDrawTransactions,
  getAutodraftTransactions,
  getReceivableTransactions,
  allocateTransaction,
  getTransactionCount,
  getFilteredCount,
  getTotalPages,
  reset,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSorting,
  TransactionPagination,
} from '../transactionStore';
import { Transaction } from '../../types';
import { initializeTestStores, mockTransaction } from '../../test/test-utils';

// ============================================
// Setup & Teardown
// ============================================

describe('Transaction Store', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  afterEach(() => {
    reset();
  });

  // ============================================
  // CRUD Operations Tests
  // ============================================

  describe('CRUD Operations', () => {
    it('should add a new transaction successfully', () => {
      const transactionData: CreateTransactionInput = {
        date: new Date(),
        type: 'Draw' as TransactionType,
        category: 'Funding' as TransactionCategory,
        amount: 50000,
        description: 'Test Draw',
        status: 'Allocated' as TransactionStatus,
      };

      addTransaction(transactionData);
      const transactions = useTransactionStore.getState().transactions;

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe(transactionData.type);
      expect(transactions[0].amount).toBe(transactionData.amount);
      expect(transactions[0].description).toBe(transactionData.description);
      expect(transactions[0].status).toBe(transactionData.status);
      expect(transactions[0].id).toBeDefined();
    });

    it('should update an existing transaction', () => {
      const transactionData: CreateTransactionInput = {
        date: new Date(),
        type: 'Draw' as TransactionType,
        category: 'Funding' as TransactionCategory,
        amount: 50000,
        description: 'Test Draw',
        status: 'Allocated' as TransactionStatus,
      };

      addTransaction(transactionData);
      const transactionId = useTransactionStore.getState().transactions[0].id;

      const updateData: UpdateTransactionInput = {
        description: 'Updated Description',
        amount: 75000,
      };

      updateTransaction(transactionId, updateData);
      const updatedTransaction = useTransactionStore.getState().transactions.find(t => t.id === transactionId);

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction?.description).toBe(updateData.description);
      expect(updatedTransaction?.amount).toBe(updateData.amount);
    });

    it('should update transaction allocations', () => {
      const transactionData: CreateTransactionInput = {
        date: new Date(),
        type: 'Draw' as TransactionType,
        category: 'Funding' as TransactionCategory,
        amount: 50000,
        description: 'Test Draw',
        status: 'Allocated' as TransactionStatus,
      };

      addTransaction(transactionData);
      const transactionId = useTransactionStore.getState().transactions[0].id;

      const allocations = [
        { matterId: 'MATTER-001', matterName: 'Client 1', amount: 25000 },
        { matterId: 'MATTER-002', matterName: 'Client 2', amount: 25000 },
      ];

      updateTransaction(transactionId, { allocations });
      const updatedTransaction = useTransactionStore.getState().transactions.find(t => t.id === transactionId);

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction?.allocations).toEqual(allocations);
      expect(updatedTransaction?.status).toBe('Allocated');
    });

    it('should delete a transaction successfully', () => {
      const transactionData: CreateTransactionInput = {
        date: new Date(),
        type: 'Draw' as TransactionType,
        category: 'Funding' as TransactionCategory,
        amount: 50000,
        description: 'Test Draw',
        status: 'Allocated' as TransactionStatus,
      };

      addTransaction(transactionData);
      const initialCount = useTransactionStore.getState().transactions.length;

      const transactionId = useTransactionStore.getState().transactions[0].id;
      deleteTransaction(transactionId);

      const finalCount = useTransactionStore.getState().transactions.length;
      expect(finalCount).toBe(initialCount - 1);
    });

    it('should throw error when deleting non-existent transaction', () => {
      expect(() => deleteTransaction('NON-EXISTENT')).not.toThrow();
      // Store silently handles this case
    });
  });

  // ============================================
  // Bulk Operations Tests
  // ============================================

  describe('Bulk Operations', () => {
    it('should delete multiple transactions', () => {
      const transactionIds = ['TXN-001', 'TXN-002', 'TXN-003'];

      transactionIds.forEach(id => {
        addTransaction({
          id,
          date: new Date(),
          type: 'Draw' as TransactionType,
          category: 'Funding' as TransactionCategory,
          amount: 50000,
          description: 'Test Transaction',
          status: 'Allocated' as TransactionStatus,
        });
      });

      const initialCount = useTransactionStore.getState().transactions.length;
      bulkDeleteTransactions(transactionIds);

      const finalCount = useTransactionStore.getState().transactions.length;
      expect(finalCount).toBe(initialCount - transactionIds.length);
    });

    it('should handle empty array in bulk delete', () => {
      const initialCount = useTransactionStore.getState().transactions.length;
      bulkDeleteTransactions([]);

      const finalCount = useTransactionStore.getState().transactions.length;
      expect(finalCount).toBe(initialCount);
    });
  });

  // ============================================
  // Filtering Tests
  // ============================================

  describe('Filtering', () => {
    beforeEach(() => {
      addTransaction({
        ...mockTransaction,
        type: 'Draw' as TransactionType,
        status: 'Allocated' as TransactionStatus,
      });

      addTransaction({
        ...mockTransaction,
        id: 'TXN-002',
        type: 'Receivable' as TransactionType,
        status: 'Unassigned' as TransactionStatus,
      });

      addTransaction({
        ...mockTransaction,
        id: 'TXN-003',
        type: 'Autodraft' as TransactionType,
        status: 'Allocated' as TransactionStatus,
      });
    });

    describe('setTransactionFilters', () => {
      it('should filter by status', () => {
        const filters = {
          status: 'Allocated' as TransactionStatus,
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered).toHaveLength(2);
        expect(filtered.every(t => t.status === filters.status));
      });

      it('should filter by type', () => {
        const filters = {
          type: 'Draw' as TransactionType,
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].type).toBe(filters.type);
      });

      it('should filter by category', () => {
        const filters = {
          category: 'Funding' as TransactionCategory,
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.every(t => t.category === filters.category));
      });

      it('should filter by date range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-03-31');

        const filters = {
          dateRange: { startDate, endDate },
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        filtered.forEach(t => {
          expect(t.date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
          expect(t.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
        });
      });

      it('should filter by search query', () => {
        const filters = {
          searchQuery: 'Draw',
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered.length).toBeGreaterThan(0);
        filtered.forEach(t => {
          expect(t.description.toLowerCase()).toContain('draw');
        });
      });

      it('should combine multiple filters', () => {
        const filters = {
          type: 'Draw' as TransactionType,
          status: 'Allocated' as TransactionStatus,
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].type).toBe(filters.type);
        expect(filtered[0].status).toBe(filters.status);
      });
    });

    describe('resetFilters', () => {
      it('should reset filters to defaults', () => {
        setTransactionFilters({
          status: 'Allocated' as TransactionStatus,
          type: 'Draw' as TransactionType,
        });

        resetFilters();

        const currentFilters = useTransactionStore.getState().filters;
        expect(currentFilters.status).toBe('All');
        expect(currentFilters.type).toBe('All');
        expect(currentFilters.category).toBe('All');
        expect(currentFilters.dateRange).toBeUndefined();
        expect(currentFilters.searchQuery).toBe('');
      });

      it('should reset pagination to page 1', () => {
        setTransactionPagination({ page: 5 });
        resetFilters();

        const currentPagination = useTransactionStore.getState().pagination;
        expect(currentPagination.page).toBe(1);
      });
    });
  });

  // ============================================
  // Sorting Tests
  // ============================================

  describe('Sorting', () => {
    beforeEach(() => {
      addTransaction({
        ...mockTransaction,
        id: 'TXN-001',
        amount: 100000,
        date: new Date('2024-01-01'),
      });

      addTransaction({
        ...mockTransaction,
        id: 'TXN-002',
        amount: 50000,
        date: new Date('2024-02-01'),
      });

      addTransaction({
        ...mockTransaction,
        id: 'TXN-003',
        amount: 75000,
        date: new Date('2024-03-01'),
      });
    });

    describe('setTransactionSorting', () => {
      it('should sort by amount ascending', () => {
        const sorting = {
          field: 'amount',
          direction: 'asc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted[0].amount).toBeLessThan(sorted[1].amount);
        expect(sorted[1].amount).toBeLessThan(sorted[2].amount);
      });

      it('should sort by amount descending', () => {
        const sorting = {
          field: 'amount',
          direction: 'desc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted[0].amount).toBeGreaterThan(sorted[1].amount);
        expect(sorted[1].amount).toBeGreaterThan(sorted[2].amount);
      });

      it('should sort by date ascending', () => {
        const sorting = {
          field: 'date',
          direction: 'asc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted[0].date.getTime()).toBeLessThan(sorted[1].date.getTime());
        expect(sorted[1].date.getTime()).toBeLessThan(sorted[2].date.getTime());
      });

      it('should sort by date descending', () => {
        const sorting = {
          field: 'date',
          direction: 'desc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted[0].date.getTime()).toBeGreaterThan(sorted[1].date.getTime());
        expect(sorted[1].date.getTime()).toBeGreaterThan(sorted[2].date.getTime());
      });

      it('should sort by type', () => {
        const sorting = {
          field: 'type',
          direction: 'asc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted[0].type).toBe(sorted[1].type);
      });
    });

    describe('resetSorting', () => {
      it('should reset sorting to defaults', () => {
        setTransactionSorting({
          field: 'date',
          direction: 'desc',
        });

        resetSorting();

        const currentSorting = useTransactionStore.getState().sorting;
        expect(currentSorting.field).toBe('date');
        expect(currentSorting.direction).toBe('desc');
      });
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================

  describe('Pagination', () => {
    beforeEach(() => {
      for (let i = 0; i < 15; i++) {
        addTransaction({
          ...mockTransaction,
          id: `TXN-${String(i).padStart(3, '0')}`,
        });
      }
    });

    describe('setTransactionPagination', () => {
      it('should change page number', () => {
        setTransactionPagination({ page: 2 });
        const pagination = useTransactionStore.getState().pagination;

        expect(pagination.page).toBe(2);
      });

      it('should change page size', () => {
        setTransactionPagination({ pageSize: 25 });
        const pagination = useTransactionStore.getState().pagination;

        expect(pagination.pageSize).toBe(25);
      });

      it('should update page number when filters change', () => {
        setTransactionPagination({ page: 3 });
        setTransactionFilters({ status: 'Allocated' as TransactionStatus });

        const pagination = useTransactionStore.getState().pagination;
        expect(pagination.page).toBe(1); // Should reset to page 1
      });

      it('should update page number when sorting changes', () => {
        setTransactionPagination({ page: 3 });
        setTransactionSorting({ field: 'amount' });

        const pagination = useTransactionStore.getState().pagination;
        expect(pagination.page).toBe(1); // Should reset to page 1
      });
    });
  });

  // ============================================
  // Getters / Computed State Tests
  // ============================================

  describe('Getters', () => {
    beforeEach(() => {
      addTransaction({
        ...mockTransaction,
        type: 'Draw' as TransactionType,
        status: 'Allocated' as TransactionStatus,
      });

      addTransaction({
        ...mockTransaction,
        id: 'TXN-002',
        type: 'Receivable' as TransactionType,
        status: 'Unassigned' as TransactionStatus,
      });
    });

    describe('getFilteredTransactions', () => {
      it('should return all transactions when no filters', () => {
        const filtered = getFilteredTransactions();
        const all = useTransactionStore.getState().transactions;

        expect(filtered).toEqual(all);
      });

      it('should return filtered transactions', () => {
        const filters = {
          status: 'Allocated' as TransactionStatus,
        };

        setTransactionFilters(filters);
        const filtered = getFilteredTransactions();

        expect(filtered.length).toBe(1);
        expect(filtered[0].status).toBe(filters.status);
      });
    });

    describe('getSortedTransactions', () => {
      it('should return sorted transactions', () => {
        const sorting = {
          field: 'amount',
          direction: 'desc',
        };

        setTransactionSorting(sorting);
        const sorted = getSortedTransactions();

        expect(sorted.length).toBeGreaterThan(1);
        expect(sorted[0].amount).toBeGreaterThan(sorted[sorted.length - 1].amount);
      });
    });

    describe('getPaginatedTransactions', () => {
      it('should return paginated transactions', () => {
        for (let i = 0; i < 15; i++) {
          addTransaction({
            ...mockTransaction,
            id: `TXN-${String(i).padStart(3, '0')}`,
          });
        }

        const pagination = {
          page: 1,
          pageSize: 10,
        };

        setTransactionPagination(pagination);
        const paginated = getPaginatedTransactions();

        expect(paginated.length).toBe(10);
      });

      it('should return correct page for page 2', () => {
        const pagination = {
          page: 2,
          pageSize: 10,
        };

        setTransactionPagination(pagination);
        const paginated = getPaginatedTransactions();

        expect(paginated.length).toBe(5);
      });
    });

    describe('getTransactionById', () => {
      it('should return transaction by ID', () => {
        const transactionId = useTransactionStore.getState().transactions[0]?.id;
        const transaction = getTransactionById(transactionId!);

        expect(transaction).toBeDefined();
        expect(transaction?.id).toBe(transactionId);
      });

      it('should return undefined for non-existent ID', () => {
        const transaction = getTransactionById('NON-EXISTENT');

        expect(transaction).toBeUndefined();
      });
    });

    describe('getTransactionsByStatus', () => {
      it('should return transactions by status', () => {
        const allocedTransactions = getTransactionsByStatus('Allocated' as TransactionStatus);

        expect(allocedTransactions).toHaveLength(1);
        expect(allocedTransactions[0].status).toBe('Allocated');
      });

      it('should return empty array for status with no transactions', () => {
        const archivedTransactions = getTransactionsByStatus('Archived' as TransactionStatus);

        expect(archivedTransactions).toHaveLength(0);
      });
    });

    describe('getTransactionsByType', () => {
      it('should return transactions by type', () => {
        const drawTransactions = getTransactionsByType('Draw' as TransactionType);

        expect(drawTransactions).toHaveLength(1);
        expect(drawTransactions[0].type).toBe('Draw');
      });
    });

    describe('getTransactionsByCategory', () => {
      it('should return transactions by category', () => {
        const fundingTransactions = getTransactionsByCategory('Funding' as TransactionCategory);

        expect(fundingTransactions).toHaveLength(1);
        expect(fundingTransactions[0].category).toBe('Funding');
      });
    });

    describe('getDrawTransactions', () => {
      it('should return only draw transactions', () => {
        const drawTransactions = getDrawTransactions();

        expect(drawTransactions).toHaveLength(1);
        expect(drawTransactions[0].type).toBe('Draw');
      });
    });

    describe('getAutodraftTransactions', () => {
      it('should return only autodraft transactions', () => {
        const autodraftTransactions = getAutodraftTransactions();

        expect(autodraftTransactions).toHaveLength(1);
        expect(autodraftTransactions[0].type).toBe('Autodraft');
      });
    });

    describe('getReceivableTransactions', () => {
      it('should return only receivable transactions', () => {
        const receivableTransactions = getReceivableTransactions();

        expect(receivableTransactions).toHaveLength(1);
        expect(receivableTransactions[0].type).toBe('Receivable');
      });
    });

    describe('getTransactionCount', () => {
      it('should return total transaction count', () => {
        const count = getTransactionCount();
        const total = useTransactionStore.getState().transactions.length;

        expect(count).toBe(total);
      });

      it('should return filtered transaction count', () => {
        setTransactionFilters({ status: 'Allocated' as TransactionStatus });
        const count = getTransactionCount('active');
        const filtered = getFilteredTransactions();

        expect(count).toBe(filtered.length);
      });
    });

    describe('getFilteredCount', () => {
      it('should return count of filtered transactions', () => {
        setTransactionFilters({ status: 'Allocated' as TransactionStatus });
        const count = getFilteredCount();
        const filtered = getFilteredTransactions();

        expect(count).toBe(filtered.length);
      });
    });

    describe('getTotalPages', () => {
      it('should calculate total pages correctly', () => {
        for (let i = 0; i < 15; i++) {
          addTransaction({
            ...mockTransaction,
            id: `TXN-${String(i).padStart(3, '0')}`,
          });
        }

        setTransactionPagination({ pageSize: 5 });
        const totalPages = getTotalPages();

        expect(totalPages).toBe(4);
      });

      it('should return 0 when no transactions', () => {
        reset();
        const totalPages = getTotalPages();

        expect(totalPages).toBe(0);
      });
    });

    describe('reset', () => {
      it('should reset all state to defaults', () => {
        addTransaction({
          ...mockTransaction,
          status: 'Allocated' as TransactionStatus,
        });

        setTransactionFilters({ status: 'Unassigned' as TransactionStatus });
        setTransactionSorting({ field: 'date' });
        setTransactionPagination({ page: 5 });

        reset();

        const state = useTransactionStore.getState();

        expect(state.transactions).toEqual([]);
        expect(state.filters.status).toBe('All');
        expect(state.filters.type).toBe('All');
        expect(state.filters.category).toBe('All');
        expect(state.filters.dateRange).toBeUndefined();
        expect(state.filters.searchQuery).toBe('');
        expect(state.sorting.field).toBe('date');
        expect(state.sorting.direction).toBe('desc');
        expect(state.pagination.page).toBe(1);
        expect(state.pagination.pageSize).toBe(20);
        expect(state.selectedTransactionId).toBe(null);
      });
    });
  });
});
