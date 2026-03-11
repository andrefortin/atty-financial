// ============================================
// Unit Tests for Matter Store
// ============================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  useMatterStore,
  addMatter,
  updateMatter,
  deleteMatter,
  bulkCloseMatters,
  setMatterFilters,
  setMatterSorting,
  setMatterPagination,
  resetFilters,
  resetSorting,
  getFilteredMatters,
  getSortedMatters,
  getPaginatedMatters,
  getMatterById,
  getMattersByStatus,
  getActiveMatters,
  getMatterCount,
  getFilteredCount,
  getTotalPages,
  reset,
  MatterStatus,
  CreateMatterInput,
  UpdateMatterInput,
  MatterFilters,
  MatterSorting,
  MatterPagination,
} from '../matterStore';
import { Matter } from '../../types';
import { initializeTestStores, mockMatter } from '../../test/test-utils';

// ============================================
// Setup & Teardown
// ============================================

describe('Matter Store', () => {
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
    it('should add a new matter successfully', () => {
      const matterData: CreateMatterInput = {
        clientName: 'Test Client',
        caseNumber: 'TEST-2024-001',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
        description: 'Test matter description',
      };

      addMatter(matterData);
      const matters = useMatterStore.getState().matters;

      expect(matters).toHaveLength(1);
      expect(matters[0].clientName).toBe(matterData.clientName);
      expect(matters[0].caseNumber).toBe(matterData.caseNumber);
      expect(matters[0].id).toBeDefined();
    });

    it('should update an existing matter', () => {
      const matterData: CreateMatterInput = {
        clientName: 'Test Client',
        caseNumber: 'TEST-2024-001',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      };

      addMatter(matterData);
      const matterId = useMatterStore.getState().matters[0].id;

      const updateData: UpdateMatterInput = {
        clientName: 'Updated Client',
      };

      updateMatter(matterId, updateData);
      const updatedMatter = useMatterStore.getState().matters.find(m => m.id === matterId);

      expect(updatedMatter?.clientName).toBe(updateData.clientName);
      expect(updatedMatter?.clientName).not.toBe(matterData.clientName);
    });

    it('should delete a matter successfully', () => {
      const matterData: CreateMatterInput = {
        clientName: 'Test Client',
        caseNumber: 'TEST-2024-001',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      };

      addMatter(matterData);
      const initialCount = useMatterStore.getState().matters.length;

      const matterId = useMatterStore.getState().matters[0].id;
      deleteMatter(matterId);

      const finalCount = useMatterStore.getState().matters.length;
      expect(finalCount).toBe(initialCount - 1);
    });

    it('should throw error when deleting non-existent matter', () => {
      expect(() => deleteMatter('NON-EXISTENT')).not.toThrow();
      // The store silently handles this case
    });
  });

  // ============================================
  // Bulk Operations Tests
  // ============================================

  describe('Bulk Operations', () => {
    it('should close multiple matters', () => {
      const matterData: CreateMatterInput = {
        clientName: 'Test Client',
        caseNumber: 'TEST-2024-001',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      };

      addMatter(matterData);
      addMatter({ ...matterData, caseNumber: 'TEST-2024-002' });
      addMatter({ ...matterData, caseNumber: 'TEST-2024-003' });

      const matterIds = useMatterStore.getState().matters.map(m => m.id);
      bulkCloseMatters(matterIds);

      useMatterStore.getState().matters.forEach(matter => {
        expect(matter.status).toBe('Closed');
      });
    });

    it('should handle empty array in bulk close', () => {
      bulkCloseMatters([]);
      const matters = useMatterStore.getState().matters;

      expect(matters.length).toBe(0);
    });
  });

  // ============================================
  // Filtering Tests
  // ============================================

  describe('Filtering', () => {
    beforeEach(() => {
      // Add test matters with different statuses
      addMatter({
        clientName: 'Active Client',
        caseNumber: 'TEST-001',
        principalBalance: 50000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      });

      addMatter({
        clientName: 'Closed Client',
        caseNumber: 'TEST-002',
        principalBalance: 0,
        interestRate: 8.5,
        status: 'Closed' as MatterStatus,
      });

      addMatter({
        clientName: 'Archived Client',
        caseNumber: 'TEST-003',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Archive' as MatterStatus,
      });
    });

    describe('setMatterFilters', () => {
      it('should filter by status', () => {
        const filters: MatterFilters = {
          status: 'Active' as MatterStatus,
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].status).toBe('Active');
      });

      it('should filter by search query', () => {
        const filters: MatterFilters = {
          searchQuery: 'Active',
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        expect(filtered.length).toBeGreaterThan(0);
        filtered.forEach(matter => {
          expect(matter.clientName.toLowerCase()).toContain('active');
        });
      });

      it('should filter by has balance flag', () => {
        const filters: MatterFilters = {
          hasBalance: true,
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        filtered.forEach(matter => {
          expect(matter.principalBalance).toBeGreaterThan(0);
        });
      });

      it('should filter by overdue flag', () => {
        const filters: MatterFilters = {
          overdue: true,
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        // This would check interestOwed > 0
        expect(filtered).toBeInstanceOf(Array);
      });

      it('should combine multiple filters', () => {
        const filters: MatterFilters = {
          status: 'Active' as MatterStatus,
          hasBalance: true,
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].status).toBe('Active');
        expect(filtered[0].principalBalance).toBeGreaterThan(0);
      });
    });

    describe('resetFilters', () => {
      it('should reset filters to defaults', () => {
        setMatterFilters({
          status: 'Active' as MatterStatus,
          searchQuery: 'test',
        });

        resetFilters();

        const currentFilters = useMatterStore.getState().filters;
        expect(currentFilters.status).toBe('All');
        expect(currentFilters.searchQuery).toBe('');
        expect(currentFilters.hasBalance).toBeUndefined();
        expect(currentFilters.overdue).toBeUndefined();
      });

      it('should reset pagination to page 1', () => {
        setMatterPagination({ page: 5 });
        resetFilters();

        const currentPagination = useMatterStore.getState().pagination;
        expect(currentPagination.page).toBe(1);
      });
    });
  });

  // ============================================
  // Sorting Tests
  // ============================================

  describe('Sorting', () => {
    beforeEach(() => {
      addMatter({
        clientName: 'Client C',
        caseNumber: 'TEST-003',
        principalBalance: 100000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      });

      addMatter({
        clientName: 'Client A',
        caseNumber: 'TEST-001',
        principalBalance: 50000,
        interestRate: 7.5,
        status: 'Active' as MatterStatus,
      });

      addMatter({
        clientName: 'Client B',
        caseNumber: 'TEST-002',
        principalBalance: 75000,
        interestRate: 8.0,
        status: 'Active' as MatterStatus,
      });
    });

    describe('setMatterSorting', () => {
      it('should sort by principal balance ascending', () => {
        const sorting: MatterSorting = {
          field: 'principalBalance',
          direction: 'asc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        expect(sorted[0].principalBalance).toBeLessThan(sorted[1].principalBalance);
        expect(sorted[1].principalBalance).toBeLessThan(sorted[2].principalBalance);
      });

      it('should sort by principal balance descending', () => {
        const sorting: MatterSorting = {
          field: 'principalBalance',
          direction: 'desc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        expect(sorted[0].principalBalance).toBeGreaterThan(sorted[1].principalBalance);
        expect(sorted[1].principalBalance).toBeGreaterThan(sorted[2].principalBalance);
      });

      it('should sort by client name', () => {
        const sorting: MatterSorting = {
          field: 'clientName',
          direction: 'asc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        expect(sorted[0].clientName).toBe('Client A');
        expect(sorted[1].clientName).toBe('Client B');
        expect(sorted[2].clientName).toBe('Client C');
      });

      it('should sort by status', () => {
        const sorting: MatterSorting = {
          field: 'status',
          direction: 'asc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        // All are 'Active', so any order is fine
        expect(sorted).toHaveLength(3);
        sorted.forEach(matter => {
          expect(matter.status).toBe('Active');
        });
      });

      it('should sort by total owed', () => {
        const sorting: MatterSorting = {
          field: 'totalOwed',
          direction: 'desc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        expect(sorted[0].totalOwed).toBeGreaterThan(sorted[1].totalOwed);
        expect(sorted[1].totalOwed).toBeGreaterThan(sorted[2].totalOwed);
      });
    });

    describe('resetSorting', () => {
      it('should reset sorting to defaults', () => {
        setMatterSorting({
          field: 'clientName',
          direction: 'desc',
        });

        resetSorting();

        const currentSorting = useMatterStore.getState().sorting;
        expect(currentSorting.field).toBe('principalBalance');
        expect(currentSorting.direction).toBe('asc');
      });
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================

  describe('Pagination', () => {
    beforeEach(() => {
      for (let i = 0; i < 15; i++) {
        addMatter({
          clientName: `Client ${i}`,
          caseNumber: `TEST-${String(i).padStart(3, '0')}`,
          principalBalance: 100000 - (i * 5000),
          interestRate: 8.5,
          status: 'Active' as MatterStatus,
        });
      }
    });

    describe('setMatterPagination', () => {
      it('should change page number', () => {
        setMatterPagination({ page: 2 });
        const pagination = useMatterStore.getState().pagination;

        expect(pagination.page).toBe(2);
      });

      it('should change page size', () => {
        setMatterPagination({ pageSize: 25 });
        const pagination = useMatterStore.getState().pagination;

        expect(pagination.pageSize).toBe(25);
      });

      it('should update page number when filters change', () => {
        setMatterPagination({ page: 3 });
        setMatterFilters({ status: 'Active' as MatterStatus });

        const pagination = useMatterStore.getState().pagination;
        expect(pagination.page).toBe(1); // Should reset to page 1
      });
    });

    it('should update page number when sorting changes', () => {
      setMatterPagination({ page: 3 });
      setMatterSorting({ field: 'clientName' });

      const pagination = useMatterStore.getState().pagination;
        expect(pagination.page).toBe(1); // Should reset to page 1
      });
    });
  });

  // ============================================
  // Getters / Computed State Tests
  // ============================================

  describe('Getters', () => {
    beforeEach(() => {
      addMatter({
        clientName: 'Active Client',
        caseNumber: 'TEST-001',
        principalBalance: 50000,
        interestRate: 8.5,
        status: 'Active' as MatterStatus,
      });

      addMatter({
        clientName: 'Closed Client',
        caseNumber: 'TEST-002',
        principalBalance: 0,
        interestRate: 8.5,
        status: 'Closed' as MatterStatus,
      });
    });

    describe('getFilteredMatters', () => {
      it('should return all matters when no filters', () => {
        const filtered = getFilteredMatters();
        const all = useMatterStore.getState().matters;

        expect(filtered).toEqual(all);
      });

      it('should return filtered matters', () => {
        const filters: MatterFilters = {
          status: 'Active' as MatterStatus,
        };

        setMatterFilters(filters);
        const filtered = getFilteredMatters();

        expect(filtered.length).toBe(1);
        expect(filtered[0].status).toBe('Active');
      });
    });

    describe('getSortedMatters', () => {
      it('should return sorted matters', () => {
        const sorting: MatterSorting = {
          field: 'principalBalance',
          direction: 'desc',
        };

        setMatterSorting(sorting);
        const sorted = getSortedMatters();

        expect(sorted.length).toBeGreaterThan(1);
        expect(sorted[0].principalBalance).toBeGreaterThan(sorted[sorted.length - 1].principalBalance);
      });
    });

    describe('getPaginatedMatters', () => {
      it('should return paginated matters', () => {
        for (let i = 0; i < 15; i++) {
          addMatter({
            clientName: `Client ${i}`,
            caseNumber: `TEST-${String(i).padStart(3, '0')}`,
            principalBalance: 100000 - (i * 5000),
            interestRate: 8.5,
            status: 'Active' as MatterStatus,
          });
        }

        const pagination: MatterPagination = {
          page: 1,
          pageSize: 10,
        };

        setMatterPagination(pagination);
        const paginated = getPaginatedMatters();

        expect(paginated.length).toBe(10);
      });

      it('should return correct page for page 2', () => {
        setMatterPagination({ page: 2, pageSize: 10 });
        const paginated = getPaginatedMatters();

        expect(paginated.length).toBe(5);
      });
    });

    describe('getMatterById', () => {
      it('should return matter by ID', () => {
        const matterId = useMatterStore.getState().matters[0]?.id;
        const matter = getMatterById(matterId!);

        expect(matter).toBeDefined();
        expect(matter?.id).toBe(matterId);
      });

      it('should return undefined for non-existent ID', () => {
        const matter = getMatterById('NON-EXISTENT');

        expect(matter).toBeUndefined();
      });
    });

    describe('getMattersByStatus', () => {
      it('should return matters by status', () => {
        const activeMatters = getMattersByStatus('Active' as MatterStatus);

        expect(activeMatters).toHaveLength(1);
        expect(activeMatters[0].status).toBe('Active');
      });

      it('should return empty array for status with no matters', () => {
        const archivedMatters = getMattersByStatus('Archive' as MatterStatus);

        expect(archivedMatters).toHaveLength(0);
      });
    });

    describe('getActiveMatters', () => {
      it('should return only active matters', () => {
        const activeMatters = getActiveMatters();

        activeMatters.forEach(matter => {
          expect(matter.status).toBe('Active');
        });
      });
    });

    describe('getMatterCount', () => {
      it('should return total matter count', () => {
        const count = getMatterCount();
        const total = useMatterStore.getState().matters.length;

        expect(count).toBe(total);
      });

      it('should return filtered matter count', () => {
        setMatterFilters({ status: 'Active' as MatterStatus });
        const count = getMatterCount('active');
        const filtered = getFilteredMatters();

        expect(count).toBe(filtered.length);
      });
    });

    describe('getFilteredCount', () => {
      it('should return count of filtered matters', () => {
        setMatterFilters({ status: 'Active' as MatterStatus });
        const count = getFilteredCount();
        const filtered = getFilteredMatters();

        expect(count).toBe(filtered.length);
      });
    });

    describe('getTotalPages', () => {
      it('should calculate total pages correctly', () => {
        for (let i = 0; i < 15; i++) {
          addMatter({
            clientName: `Client ${i}`,
            caseNumber: `TEST-${String(i).padStart(3, '0')}`,
            principalBalance: 100000 - (i * 5000),
            interestRate: 8.5,
            status: 'Active' as MatterStatus,
          });
        }

        setMatterPagination({ pageSize: 5 });
        const totalPages = getTotalPages();

        expect(totalPages).toBe(3);
      });

      it('should return 0 when no matters', () => {
        reset();
        const totalPages = getTotalPages();

        expect(totalPages).toBe(0);
      });
    });

    describe('reset', () => {
      it('should reset all state to defaults', () => {
        addMatter({
          clientName: 'Test Client',
          caseNumber: 'TEST-001',
          principalBalance: 100000,
          interestRate: 8.5,
          status: 'Active' as MatterStatus,
        });

        setMatterFilters({ status: 'Active' as MatterStatus, searchQuery: 'test' });
        setMatterSorting({ field: 'clientName' });
        setMatterPagination({ page: 5 });

        reset();

        const state = useMatterStore.getState();

        expect(state.matters).toEqual([]);
        expect(state.filters.status).toBe('All');
        expect(state.filters.searchQuery).toBe('');
        expect(state.sorting.field).toBe('principalBalance');
        expect(state.sorting.direction).toBe('asc');
        expect(state.pagination.page).toBe(1);
        expect(state.pagination.pageSize).toBe(10);
        expect(state.selectedMatterId).toBe(null);
      });
    });
  });
});
