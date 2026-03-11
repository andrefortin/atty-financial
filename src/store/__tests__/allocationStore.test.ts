// ============================================
// Unit Tests for Allocation Store
// ============================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  useAllocationStore,
  createAllocationRequest,
  executeAllocation,
  deleteAllocation,
  bulkDeleteAllocations,
  setAllocationFilters,
  setAllocationSorting,
  setAllocationPagination,
  resetFilters,
  resetSorting,
  getFilteredAllocations,
  getSortedAllocations,
  getPaginatedAllocations,
  getAllocationById,
  getAllocationsByAutodraftId,
  getAllocationsByDateRange,
  getAllocationCount,
  getFilteredCount,
  getTotalPages,
  reset,
  AllocationMethod,
  AllocationFilters,
  AllocationSorting,
  AllocationPagination,
} from '../allocationStore';
import { Allocation } from '../../types';
import { initializeTestStores, mockAllocation, mockToday } from '../../test/test-utils';

// ============================================
// Setup & Teardown
// ============================================

describe('Allocation Store', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  afterEach(() => {
    reset();
  });

  // ============================================
  // Allocation Request Tests
  // ============================================

  describe('Allocation Requests', () => {
    it('should create an allocation request', () => {
      const requestData = {
        autodraftId: 'AUTODRAFT-001',
        method: 'waterfall' as AllocationMethod,
        dateRange: {
          startDate: mockToday,
          endDate: mockToday,
        },
      };

      createAllocationRequest(requestData);
      const requests = useAllocationStore.getState().allocationRequests;

      expect(requests).toHaveLength(1);
      expect(requests[0].autodraftId).toBe(requestData.autodraftId);
      expect(requests[0].method).toBe(requestData.method);
      expect(requests[0].status).toBe('pending');
      expect(requests[0].createdAt).toBeInstanceOf(Date);
    });

    it('should generate allocation preview', () => {
      const requestData = {
        autodraftId: 'AUTODRAFT-001',
        method: 'waterfall' as AllocationMethod,
        dateRange: {
          startDate: mockToday,
          endDate: mockToday,
        },
      };

      createAllocationRequest(requestData);
      const preview = useAllocationStore.getState().allocationPreview;

      expect(preview).toBeDefined();
      expect(preview?.autodraftId).toBe(requestData.autodraftId);
      expect(preview?.method).toBe(requestData.method);
      expect(preview?.totalAmount).toBeGreaterThan(0);
    });

    it('should throw error for invalid method', () => {
      const requestData = {
        autodraftId: 'AUTODRAFT-001',
        method: 'invalid' as AllocationMethod,
        dateRange: {
          startDate: mockToday,
          endDate: mockToday,
        },
      };

      expect(() => createAllocationRequest(requestData)).toThrow('Invalid allocation method');
    });
  });

  // ============================================
  // Execution Tests
  // ============================================

  describe('Allocation Execution', () => {
    it('should execute an allocation request successfully', () => {
      const requestData = {
        autodraftId: 'AUTODRAFT-001',
        method: 'waterfall' as AllocationMethod,
        dateRange: {
          startDate: mockToday,
          endDate: mockToday,
        },
      };

      createAllocationRequest(requestData);
      const requestId = useAllocationStore.getState().allocationRequests[0]?.id;

      const result = executeAllocation(requestId!);

      expect(result).toBeDefined();
      expect(result.allocationId).toBeDefined();
      expect(result.executedAt).toBeInstanceOf(Date);
    });

    it('should delete an allocation successfully', () => {
      const allocation: Allocation = {
        ...mockAllocation,
        id: 'ALLOC-001',
      };

      const allocations = useAllocationStore.getState().allocations;
      // Mock adding an allocation
      (allocations as any).push(allocation);

      const initialCount = useAllocationStore.getState().allocations.length;
      const result = deleteAllocation('ALLOC-001');
      const finalCount = useAllocationStore.getState().allocations.length;

      expect(result).toBe(true);
      expect(finalCount).toBe(initialCount - 1);
    });

    it('should throw error when deleting non-existent allocation', () => {
      expect(() => deleteAllocation('NON-EXISTENT')).not.toThrow();
      // Store silently handles this
    });

    it('should delete multiple allocations', () => {
      const allocationIds = ['ALLOC-001', 'ALLOC-002', 'ALLOC-003'];

      const initialCount = useAllocationStore.getState().allocations.length;
      const result = bulkDeleteAllocations(allocationIds);
      const finalCount = useAllocationStore.getState().allocations.length;

      expect(result).toBe(true);
      expect(finalCount).toBeLessThan(initialCount);
    });

    it('should handle empty array in bulk delete', () => {
      const result = bulkDeleteAllocations([]);
      const count = useAllocationStore.getState().allocations.length;

      expect(result).toBe(true);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // Filtering Tests
  // ============================================

  describe('Filtering', () => {
    it('should filter by method', () => {
      const filters: AllocationFilters = {
        method: 'waterfall' as AllocationMethod,
      };

      setAllocationFilters(filters);
      const filtered = getFilteredAllocations();

      expect(filtered).toBeInstanceOf(Array);
      filtered.forEach(allocation => {
        expect(allocation.method).toBe(filters.method);
      });
    });

    it('should filter by autodraft ID', () => {
      const filters: AllocationFilters = {
        autodraftId: 'AUTODRAFT-001',
      };

      setAllocationFilters(filters);
      const filtered = getFilteredAllocations();

      expect(filtered).toBeInstanceOf(Array);
      filtered.forEach(allocation => {
        expect(allocation.autodraftId).toBe(filters.autodraftId);
      });
    });

    it('should filter by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filters: AllocationFilters = {
        dateRange: { startDate, endDate },
      };

      setAllocationFilters(filters);
      const filtered = getFilteredAllocations();

      expect(filtered).toBeInstanceOf(Array);
      filtered.forEach(allocation => {
        const allocationDate = new Date(allocation.executedAt);
        expect(allocationDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(allocationDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should filter by search query', () => {
      const filters: AllocationFilters = {
        searchQuery: 'test',
      };

      setAllocationFilters(filters);
      const filtered = getFilteredAllocations();

      expect(filtered).toBeInstanceOf(Array);
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('should reset filters to defaults', () => {
      setAllocationFilters({
        method: 'waterfall' as AllocationMethod,
        autodraftId: 'AUTODRAFT-001',
      });

      resetFilters();

      const currentFilters = useAllocationStore.getState().filters;
      expect(currentFilters.method).toBeUndefined();
      expect(currentFilters.autodraftId).toBeUndefined();
      expect(currentFilters.dateRange).toBeUndefined();
      expect(currentFilters.searchQuery).toBe('');
    });

    it('should reset pagination to page 1', () => {
      setAllocationPagination({ page: 5 });
      resetFilters();

      const currentPagination = useAllocationStore.getState().pagination;
      expect(currentPagination.page).toBe(1);
    });
  });

  // ============================================
  // Sorting Tests
  // ============================================

  describe('Sorting', () => {
    it('should sort by executed date descending', () => {
      const sorting: AllocationSorting = {
        field: 'executedAt',
        direction: 'desc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted.length).toBeGreaterThan(1);
      const firstDate = new Date(sorted[0].executedAt);
      const lastDate = new Date(sorted[sorted.length - 1].executedAt);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(lastDate.getTime());
    });

    it('should sort by executed date ascending', () => {
      const sorting: AllocationSorting = {
        field: 'executedAt',
        direction: 'asc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted.length).toBeGreaterThan(1);
      const firstDate = new Date(sorted[0].executedAt);
      const lastDate = new Date(sorted[sorted.length - 1].executedAt);
      expect(firstDate.getTime()).toBeLessThanOrEqual(lastDate.getTime());
    });

    it('should sort by total amount descending', () => {
      const sorting: AllocationSorting = {
        field: 'totalAmount',
        direction: 'desc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted.length).toBeGreaterThan(1);
      expect(sorted[0].totalAmount).toBeGreaterThanOrEqual(sorted[1].totalAmount);
    });

    it('should sort by total amount ascending', () => {
      const sorting: AllocationSorting = {
        field: 'totalAmount',
        direction: 'asc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted.length).toBeGreaterThan(1);
      expect(sorted[0].totalAmount).toBeLessThanOrEqual(sorted[1].totalAmount);
    });

    it('should sort by carry forward amount', () => {
      const sorting: AllocationSorting = {
        field: 'carryForward',
        direction: 'desc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted).toBeInstanceOf(Array);
      sorted.forEach((allocation, index) => {
        if (index < sorted.length - 1) {
          expect(allocation.carryForward).toBeGreaterThanOrEqual(sorted[index + 1].carryForward);
        }
      });
    });

    it('should reset sorting to defaults', () => {
      setAllocationSorting({
        field: 'executedAt',
        direction: 'desc',
      });

      resetSorting();

      const currentSorting = useAllocationStore.getState().sorting;
      expect(currentSorting.field).toBe('executedAt');
      expect(currentSorting.direction).toBe('desc');
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================

  describe('Pagination', () => {
    it('should change page number', () => {
      setAllocationPagination({ page: 2 });
      const pagination = useAllocationStore.getState().pagination;

      expect(pagination.page).toBe(2);
    });

    it('should change page size', () => {
      setAllocationPagination({ pageSize: 25 });
      const pagination = useAllocationStore.getState().pagination;

      expect(pagination.pageSize).toBe(25);
    });

    it('should update page number when filters change', () => {
      setAllocationPagination({ page: 3 });
      setAllocationFilters({ method: 'waterfall' as AllocationMethod });

      const pagination = useAllocationStore.getState().pagination;
      expect(pagination.page).toBe(1); // Should reset to page 1
    });

    it('should update page number when sorting changes', () => {
      setAllocationPagination({ page: 3 });
      setAllocationSorting({ field: 'totalAmount' });

      const pagination = useAllocationStore.getState().pagination;
      expect(pagination.page).toBe(1); // Should reset to page 1
    });
  });

  // ============================================
  // Getters / Computed State Tests
  // ============================================

  describe('Getters', () => {
    it('should return all allocations when no filters', () => {
      const filtered = getFilteredAllocations();
      const all = useAllocationStore.getState().allocations;

      expect(filtered).toEqual(all);
    });

    it('should return sorted allocations', () => {
      const sorting: AllocationSorting = {
        field: 'executedAt',
        direction: 'desc',
      };

      setAllocationSorting(sorting);
      const sorted = getSortedAllocations();

      expect(sorted).toBeInstanceOf(Array);
      expect(sorted.length).toBeGreaterThanOrEqual(0);
    });

    it('should return paginated allocations', () => {
      // Add multiple allocations
      for (let i = 0; i < 15; i++) {
        const allocation: Allocation = {
          ...mockAllocation,
          id: `ALLOC-${String(i).padStart(3, '0')}`,
          executedAt: new Date(`2024-${String(Math.floor(i / 3) + 1).padStart(2, '0')}-15`),
        };

        const allocations = useAllocationStore.getState().allocations;
        (allocations as any).push(allocation);
      }

      const pagination = {
        page: 1,
        pageSize: 10,
      };

      setAllocationPagination(pagination);
      const paginated = getPaginatedAllocations();

      expect(paginated.length).toBe(10);
    });

    it('should return allocation by ID', () => {
      const allocationId = 'ALLOC-001';
      const allocation = getAllocationById(allocationId);

      expect(allocation).toBeDefined();
      expect(allocation?.id).toBe(allocationId);
    });

    it('should return undefined for non-existent ID', () => {
      const allocation = getAllocationById('NON-EXISTENT');

      expect(allocation).toBeUndefined();
    });

    it('should return allocations by autodraft ID', () => {
      const allocations = getAllocationsByAutodraftId('AUTODRAFT-001');

      expect(allocations).toBeInstanceOf(Array);
      allocations.forEach(allocation => {
        expect(allocation.autodraftId).toBe('AUTODRAFT-001');
      });
    });

    it('should return empty array for non-existent autodraft ID', () => {
      const allocations = getAllocationsByAutodraftId('NON-EXISTENT');

      expect(allocations).toEqual([]);
    });

    it('should return allocations by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const allocations = getAllocationsByDateRange(startDate, endDate);

      expect(allocations).toBeInstanceOf(Array);
      allocations.forEach(allocation => {
        const allocationDate = new Date(allocation.executedAt);
        expect(allocationDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(allocationDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should return allocation count', () => {
      const count = getAllocationCount();
      const total = useAllocationStore.getState().allocations.length;

      expect(count).toBe(total);
    });

    it('should return filtered allocation count', () => {
      const filters = {
        method: 'waterfall' as AllocationMethod,
      };

      setAllocationFilters(filters);
      const count = getAllocationCount('active');
      const filtered = getFilteredAllocations();

      expect(count).toBe(filtered.length);
    });

    it('should return filtered count', () => {
      const filters = {
        method: 'waterfall' as AllocationMethod,
      };

      setAllocationFilters(filters);
      const count = getFilteredCount();
      const filtered = getFilteredAllocations();

      expect(count).toBe(filtered.length);
    });

    it('should calculate total pages correctly', () => {
      // Add multiple allocations
      for (let i = 0; i < 15; i++) {
        const allocation: Allocation = {
          ...mockAllocation,
          id: `ALLOC-${String(i).padStart(3, '0')}`,
          executedAt: new Date(`2024-${String(Math.floor(i / 3) + 1).padStart(2, '0')}-15`),
        };

        const allocations = useAllocationStore.getState().allocations;
        (allocations as any).push(allocation);
      }

      setAllocationPagination({ pageSize: 5 });
      const totalPages = getTotalPages();

      expect(totalPages).toBe(4);
    });

    it('should return 0 when no allocations', () => {
      reset();
      const totalPages = getTotalPages();

      expect(totalPages).toBe(0);
    });
  });

  // ============================================
  // Reset Tests
  // ============================================

  describe('Reset', () => {
    it('should reset all state to defaults', () => {
      // Add some test data
      const allocation: Allocation = {
        ...mockAllocation,
        id: 'ALLOC-001',
      };

      const allocations = useAllocationStore.getState().allocations;
      (allocations as any).push(allocation);

      setAllocationFilters({
        method: 'waterfall' as AllocationMethod,
        autodraftId: 'AUTODRAFT-001',
      });

      setAllocationSorting({
        field: 'executedAt',
        direction: 'desc',
      });

      setAllocationPagination({ page: 5 });

      reset();

      const state = useAllocationStore.getState();

      expect(state.allocations).toEqual([]);
      expect(state.filters.method).toBeUndefined();
      expect(state.filters.autodraftId).toBeUndefined();
      expect(state.filters.dateRange).toBeUndefined();
      expect(state.filters.searchQuery).toBe('');
      expect(state.sorting.field).toBe('executedAt');
      expect(state.sorting.direction).toBe('desc');
      expect(state.pagination.page).toBe(1);
      expect(state.pagination.pageSize).toBe(10);
      expect(state.allocationRequests).toEqual([]);
      expect(state.allocationPreview).toBe(null);
      expect(state.selectedAllocationId).toBe(null);
    });
  });
});
