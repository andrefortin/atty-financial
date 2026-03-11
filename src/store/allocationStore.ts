// Allocation Store - Zustand state management for interest allocations
// Handles allocation records, history, filtering, and allocation execution

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { InterestAllocation, AllocationRequest } from '../types';

// ============================================
// Filter and Sort Types
// ============================================

export interface AllocationFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'completed' | 'pending' | 'failed' | 'All';
  matterId?: string;
  searchQuery?: string;
}

export interface AllocationSorting {
  field: 'autodraftDate' | 'totalAmount' | 'executedAt';
  direction: 'asc' | 'desc';
}

export interface AllocationPagination {
  page: number;
  pageSize: number;
}

// ============================================
// Allocation Method Types
// ============================================

export type AllocationMethod = 'waterfall' | 'pro-rata' | 'manual';

export interface AllocationMethodConfig {
  method: AllocationMethod;
  waterfallConfig?: {
    tier1Priority: boolean; // Whether Tier 1 gets priority
  };
  proRataConfig?: {
    basedOn: 'principal' | 'interest-owed' | 'total-owed'; // Basis for pro rata calculation
  };
}

// ============================================
// State Interface
// ============================================

export interface AllocationState {
  // Data
  allocations: InterestAllocation[];
  selectedAllocationId: string | null;
  currentAllocationRequest: AllocationRequest | null;
  currentAllocationMethod: AllocationMethod;
  allocationPreview: Array<{
    matterId: string;
    matterName: string;
    allocatedAmount: number;
    interestRemainingBefore: number;
    interestRemainingAfter: number;
    tier: 1 | 2;
  }> | null;

  // Filter/Sort/Pagination state
  filters: AllocationFilters;
  sorting: AllocationSorting;
  pagination: AllocationPagination;

  // Computed (getters)
  getFilteredAllocations: () => InterestAllocation[];
  getSortedAllocations: () => InterestAllocation[];
  getPaginatedAllocations: () => InterestAllocation[];
  getAllocationById: (id: string) => InterestAllocation | undefined;
  getAllocationsByMatterId: (matterId: string) => InterestAllocation[];
  getRecentAllocations: (limit?: number) => InterestAllocation[];
  getSelectedAllocation: () => InterestAllocation | undefined;
  getTotalAllocatedAmount: (filters?: AllocationFilters) => number;
  getAllocationCount: (filters?: AllocationFilters) => number;
  getFilteredCount: () => number;
  getTotalPages: () => number;

  // Actions
  setAllocations: (allocations: InterestAllocation[]) => void;
  setSelectedAllocationId: (id: string | null) => void;
  setFilters: (filters: Partial<AllocationFilters>) => void;
  setSorting: (sorting: Partial<AllocationSorting>) => void;
  setPagination: (pagination: Partial<AllocationPagination>) => void;
  resetFilters: () => void;
  resetSorting: () => void;

  // Allocation Actions
  setCurrentAllocationRequest: (request: AllocationRequest | null) => void;
  setAllocationMethod: (method: AllocationMethod) => void;
  generateAllocationPreview: (request: AllocationRequest, method: AllocationMethod) => void;
  executeAllocation: (request: AllocationRequest, method: AllocationMethod) => InterestAllocation;
  saveAllocation: (allocation: InterestAllocation) => void;
  deleteAllocation: (id: string) => void;

  // Bulk operations
  bulkDeleteAllocations: (ids: string[]) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialFilters: AllocationFilters = {
  status: 'All',
  searchQuery: '',
};

const initialSorting: AllocationSorting = {
  field: 'autodraftDate',
  direction: 'desc',
};

const initialPagination: AllocationPagination = {
  page: 1,
  pageSize: 10,
};

// ============================================
// Helper Functions
// ============================================

function generateAllocationId(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timestamp = Date.now().toString(36).toUpperCase();
  return `ALLOC-${dateStr}-${timestamp}`;
}

// ============================================
// Store Definition
// ============================================

export const useAllocationStore = create<AllocationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial data
        allocations: [],
        selectedAllocationId: null,
        currentAllocationRequest: null,
        currentAllocationMethod: 'waterfall',
        allocationPreview: null,
        filters: initialFilters,
        sorting: initialSorting,
        pagination: initialPagination,

        // ============================================
        // Getters / Computed State
        // ============================================

        getFilteredAllocations: () => {
          const { allocations, filters } = get();
          return allocations.filter((allocation) => {
            // Date range filter
            if (filters.dateFrom && allocation.autodraftDate < filters.dateFrom) {
              return false;
            }
            if (filters.dateTo && allocation.autodraftDate > filters.dateTo) {
              return false;
            }

            // Matter filter
            if (filters.matterId) {
              const hasMatterAllocation = allocation.allocations.some(
                (a) => a.matterId === filters.matterId
              );
              if (!hasMatterAllocation) return false;
            }

            // Status filter (determined by executedAt)
            if (filters.status && filters.status !== 'All') {
              const hasExecuted = allocation.executedAt.getTime() > 0;
              if (filters.status === 'completed' && !hasExecuted) return false;
              if (filters.status === 'pending' && hasExecuted) return false;
            }

            // Search query filter
            if (filters.searchQuery) {
              const query = filters.searchQuery.toLowerCase();
              const matchesSearch =
                allocation.id.toLowerCase().includes(query) ||
                allocation.autodraftId.toLowerCase().includes(query) ||
                allocation.allocations.some((a) => a.matterName.toLowerCase().includes(query));
              if (!matchesSearch) return false;
            }

            return true;
          });
        },

        getSortedAllocations: () => {
          const filtered = get().getFilteredAllocations();
          const { field, direction } = get().sorting;

          return [...filtered].sort((a, b) => {
            let comparison = 0;

            switch (field) {
              case 'autodraftDate':
                comparison = a.autodraftDate.getTime() - b.autodraftDate.getTime();
                break;
              case 'totalAmount':
                comparison = a.totalAmount - b.totalAmount;
                break;
              case 'executedAt':
                comparison = a.executedAt.getTime() - b.executedAt.getTime();
                break;
            }

            return direction === 'asc' ? comparison : -comparison;
          });
        },

        getPaginatedAllocations: () => {
          const sorted = get().getSortedAllocations();
          const { page, pageSize } = get().pagination;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          return sorted.slice(start, end);
        },

        getAllocationById: (id) => {
          return get().allocations.find((a) => a.id === id);
        },

        getAllocationsByMatterId: (matterId) => {
          return get().allocations.filter((a) =>
            a.allocations.some((alloc) => alloc.matterId === matterId)
          );
        },

        getRecentAllocations: (limit = 10) => {
          return [...get().allocations]
            .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
            .slice(0, limit);
        },

        getSelectedAllocation: () => {
          const { selectedAllocationId, getAllocationById } = get();
          return selectedAllocationId ? getAllocationById(selectedAllocationId) : undefined;
        },

        getTotalAllocatedAmount: (filters) => {
          const { allocations } = get();
          let filtered = allocations;

          if (filters) {
            if (filters.dateFrom) {
              filtered = filtered.filter((a) => a.autodraftDate >= filters.dateFrom!);
            }
            if (filters.dateTo) {
              filtered = filtered.filter((a) => a.autodraftDate <= filters.dateTo!);
            }
            if (filters.matterId) {
              filtered = filtered.filter((a) =>
                a.allocations.some((alloc) => alloc.matterId === filters.matterId)
              );
            }
          }

          return filtered.reduce((sum, a) => sum + a.totalAmount, 0);
        },

        getAllocationCount: (filters) => {
          const { allocations } = get();
          let filtered = allocations;

          if (filters) {
            if (filters.dateFrom) {
              filtered = filtered.filter((a) => a.autodraftDate >= filters.dateFrom!);
            }
            if (filters.dateTo) {
              filtered = filtered.filter((a) => a.autodraftDate <= filters.dateTo!);
            }
            if (filters.matterId) {
              filtered = filtered.filter((a) =>
                a.allocations.some((alloc) => alloc.matterId === filters.matterId)
              );
            }
          }

          return filtered.length;
        },

        getFilteredCount: () => {
          return get().getFilteredAllocations().length;
        },

        getTotalPages: () => {
          const count = get().getFilteredCount();
          const pageSize = get().pagination.pageSize;
          return Math.ceil(count / pageSize);
        },

        // ============================================
        // Filter/Sort/Pagination Actions
        // ============================================

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
            pagination: { ...state.pagination, page: 1 },
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
        // Allocation Actions
        // ============================================

        setSelectedAllocationId: (id) => {
          set({ selectedAllocationId: id });
        },

        setAllocations: (allocations) => {
          set({ allocations });
        },

        setCurrentAllocationRequest: (request) => {
          set({ currentAllocationRequest: request, allocationPreview: null });
        },

        setAllocationMethod: (method) => {
          set({ currentAllocationMethod: method, allocationPreview: null });
        },

        generateAllocationPreview: (request, method) => {
          // This will be implemented to calculate the preview allocation
          // For now, we'll store the request and method
          set({
            currentAllocationRequest: request,
            currentAllocationMethod: method,
          });
          // The actual preview calculation will be done by the AllocationWorkflow component
        },

        executeAllocation: (request, method) => {
          // This will create an allocation record
          // The actual allocation logic will be handled by the AllocationWorkflow component
          const id = generateAllocationId();
          const allocation: InterestAllocation = {
            id,
            autodraftId: request.autodraftTransactionId,
            autodraftDate: request.autodraftDate,
            totalAmount: request.totalAmount,
            allocations: [], // Will be populated by the component
            carryForward: 0,
            executedAt: new Date(),
          };

          set((state) => ({
            allocations: [allocation, ...state.allocations],
            currentAllocationRequest: null,
            allocationPreview: null,
          }));

          return allocation;
        },

        saveAllocation: (allocation) => {
          set((state) => {
            const existing = state.allocations.find((a) => a.id === allocation.id);
            if (existing) {
              return {
                allocations: state.allocations.map((a) =>
                  a.id === allocation.id ? allocation : a
                ),
              };
            } else {
              return {
                allocations: [allocation, ...state.allocations],
              };
            }
          });
        },

        deleteAllocation: (id) => {
          set((state) => ({
            allocations: state.allocations.filter((a) => a.id !== id),
            selectedAllocationId: state.selectedAllocationId === id ? null : state.selectedAllocationId,
          }));
        },

        // ============================================
        // Bulk Actions
        // ============================================

        bulkDeleteAllocations: (ids) => {
          set((state) => ({
            allocations: state.allocations.filter((a) => !ids.includes(a.id)),
            selectedAllocationId: ids.includes(state.selectedAllocationId || '')
              ? null
              : state.selectedAllocationId,
          }));
        },

        // ============================================
        // Reset
        // ============================================

        reset: () => {
          set({
            allocations: [],
            selectedAllocationId: null,
            currentAllocationRequest: null,
            currentAllocationMethod: 'waterfall',
            allocationPreview: null,
            filters: initialFilters,
            sorting: initialSorting,
            pagination: initialPagination,
          });
        },
      }),
      {
        name: 'atty-allocation-storage',
        partialize: (state) => ({
          allocations: state.allocations,
          filters: state.filters,
          sorting: state.sorting,
        }),
      }
    ),
    { name: 'AllocationStore' }
  )
);
