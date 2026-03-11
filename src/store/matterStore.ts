// Matter Store - Zustand state management for matters
// Handles CRUD operations, filtering, sorting, pagination, and computed state

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Matter,
  MatterStatus,
  CreateMatterInput,
  UpdateMatterInput,
  MatterAlert,
} from '../types';
import { mockMatters } from '../data/mockMatters';

// ============================================
// Filter and Sort Types
// ============================================

export interface MatterFilters {
  status?: MatterStatus | 'All';
  searchQuery?: string;
  hasBalance?: boolean;
  overdue?: boolean;
}

export interface MatterSorting {
  field: 'clientName' | 'createdAt' | 'totalOwed' | 'principalBalance' | 'status';
  direction: 'asc' | 'desc';
}

export interface MatterPagination {
  page: number;
  pageSize: number;
}

// ============================================
// State Interface
// ============================================

export interface MatterState {
  // Data
  matters: Matter[];
  selectedMatterId: string | null;

  // Filter/Sort/Pagination state
  filters: MatterFilters;
  sorting: MatterSorting;
  pagination: MatterPagination;

  // Computed (getters)
  getFilteredMatters: () => Matter[];
  getSortedMatters: () => Matter[];
  getPaginatedMatters: () => Matter[];
  getMatterById: (id: string) => Matter | undefined;
  getActiveMatters: () => Matter[];
  getClosedMatters: () => Matter[];
  getMattersWithBalance: () => Matter[];
  getOverdueMatters: () => Matter[];
  getMatterAlerts: () => MatterAlert[];
  getSelectedMatter: () => Matter | undefined;
  getTotalPrincipalBalance: () => number;
  getTotalInterestAccrued: () => number;
  getTotalOwed: () => number;
  getActiveMattersCount: () => number;
  getClosedMattersCount: () => number;
  getFilteredCount: () => number;
  getTotalPages: () => number;

  // Actions
  setMatters: (matters: Matter[]) => void;
  setSelectedMatterId: (id: string | null) => void;
  setFilters: (filters: Partial<MatterFilters>) => void;
  setSorting: (sorting: Partial<MatterSorting>) => void;
  setPagination: (pagination: Partial<MatterPagination>) => void;
  resetFilters: () => void;
  resetSorting: () => void;

  // CRUD Operations
  createMatter: (input: CreateMatterInput) => Matter;
  updateMatter: (id: string, input: UpdateMatterInput) => void;
  deleteMatter: (id: string) => void;
  closeMatter: (id: string) => void;
  reopenMatter: (id: string) => void;

  // Bulk operations
  bulkDeleteMatters: (ids: string[]) => void;
  bulkCloseMatters: (ids: string[]) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialFilters: MatterFilters = {
  status: 'All',
  searchQuery: '',
  hasBalance: undefined,
  overdue: undefined,
};

const initialSorting: MatterSorting = {
  field: 'createdAt',
  direction: 'desc',
};

const initialPagination: MatterPagination = {
  page: 1,
  pageSize: 10,
};

// ============================================
// Helper Functions
// ============================================

const daysSinceClosure = (date: Date): number => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// ============================================
// Store Definition
// ============================================

export const useMatterStore = create<MatterState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial data
        matters: mockMatters,
        selectedMatterId: null,
        filters: initialFilters,
        sorting: initialSorting,
        pagination: initialPagination,

        // ============================================
        // Getters / Computed State
        // ============================================

        getFilteredMatters: () => {
          const { matters, filters } = get();
          return matters.filter((matter) => {
            // Status filter
            if (filters.status && filters.status !== 'All' && matter.status !== filters.status) {
              return false;
            }

            // Search query filter
            if (filters.searchQuery) {
              const query = filters.searchQuery.toLowerCase();
              const matchesSearch =
                matter.clientName.toLowerCase().includes(query) ||
                matter.id.toLowerCase().includes(query) ||
                (matter.notes && matter.notes.toLowerCase().includes(query));
              if (!matchesSearch) return false;
            }

            // Balance filter
            if (filters.hasBalance !== undefined) {
              const hasBalance = matter.principalBalance > 0 || matter.totalOwed > 0;
              if (filters.hasBalance !== hasBalance) return false;
            }

            // Overdue filter
            if (filters.overdue) {
              if (matter.status !== 'Closed') return false;
              if (!matter.closedAt) return false;
              if (matter.principalBalance === 0) return false;
              if (daysSinceClosure(matter.closedAt) < 20) return false;
            }

            return true;
          });
        },

        getSortedMatters: () => {
          const filtered = get().getFilteredMatters();
          const { field, direction } = get().sorting;

          return [...filtered].sort((a, b) => {
            let comparison = 0;

            switch (field) {
              case 'clientName':
                comparison = a.clientName.localeCompare(b.clientName);
                break;
              case 'createdAt':
                comparison = a.createdAt.getTime() - b.createdAt.getTime();
                break;
              case 'totalOwed':
                comparison = a.totalOwed - b.totalOwed;
                break;
              case 'principalBalance':
                comparison = a.principalBalance - b.principalBalance;
                break;
              case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            }

            return direction === 'asc' ? comparison : -comparison;
          });
        },

        getPaginatedMatters: () => {
          const sorted = get().getSortedMatters();
          const { page, pageSize } = get().pagination;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          return sorted.slice(start, end);
        },

        getMatterById: (id) => {
          return get().matters.find((m) => m.id === id);
        },

        getActiveMatters: () => {
          return get().matters.filter((m) => m.status === 'Active');
        },

        getClosedMatters: () => {
          return get().matters.filter((m) => m.status === 'Closed');
        },

        getMattersWithBalance: () => {
          return get().matters.filter((m) => m.principalBalance > 0 || m.totalOwed > 0);
        },

        getOverdueMatters: () => {
          return get().matters.filter(
            (m) =>
              m.status === 'Closed' &&
              m.closedAt &&
              m.principalBalance > 0 &&
              daysSinceClosure(m.closedAt) >= 20
          );
        },

        getMatterAlerts: () => {
          const overdue = get().getOverdueMatters();
          return overdue.map((matter) => ({
            matterId: matter.id,
            clientName: matter.clientName,
            daysSinceClosure: matter.closedAt ? daysSinceClosure(matter.closedAt) : 0,
            principalBalance: matter.principalBalance,
            alertLevel: daysSinceClosure(matter.closedAt!) >= 40 ? 'Error' : ('Warning' as const),
          }));
        },

        getSelectedMatter: () => {
          const { selectedMatterId, getMatterById } = get();
          return selectedMatterId ? getMatterById(selectedMatterId) : undefined;
        },

        getTotalPrincipalBalance: () => {
          return get().matters.reduce((sum, m) => sum + m.principalBalance, 0);
        },

        getTotalInterestAccrued: () => {
          return get().matters.reduce((sum, m) => sum + m.totalInterestAccrued, 0);
        },

        getTotalOwed: () => {
          return get().matters.reduce((sum, m) => sum + m.totalOwed, 0);
        },

        getActiveMattersCount: () => {
          return get().matters.filter((m) => m.status === 'Active').length;
        },

        getClosedMattersCount: () => {
          return get().matters.filter((m) => m.status === 'Closed').length;
        },

        getFilteredCount: () => {
          return get().getFilteredMatters().length;
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

        setSelectedMatterId: (id) => {
          set({ selectedMatterId: id });
        },

        setMatters: (matters) => {
          set({ matters });
        },

        createMatter: (input) => {
          const newMatter: Matter = {
            id: input.id,
            clientName: input.clientName,
            status: 'Active',
            notes: input.notes,
            createdAt: new Date(),
            totalDraws: 0,
            totalPrincipalPayments: 0,
            totalInterestAccrued: 0,
            interestPaid: 0,
            principalBalance: 0,
            totalOwed: 0,
          };

          set((state) => ({
            matters: [newMatter, ...state.matters],
          }));

          return newMatter;
        },

        updateMatter: (id, input) => {
          set((state) => ({
            matters: state.matters.map((matter) =>
              matter.id === id
                ? {
                    ...matter,
                    ...input,
                  }
                : matter
            ),
          }));
        },

        deleteMatter: (id) => {
          set((state) => ({
            matters: state.matters.filter((m) => m.id !== id),
            selectedMatterId: state.selectedMatterId === id ? null : state.selectedMatterId,
          }));
        },

        closeMatter: (id) => {
          set((state) => ({
            matters: state.matters.map((matter) =>
              matter.id === id
                ? {
                    ...matter,
                    status: 'Closed',
                    closedAt: new Date(),
                  }
                : matter
            ),
          }));
        },

        reopenMatter: (id) => {
          set((state) => ({
            matters: state.matters.map((matter) =>
              matter.id === id
                ? {
                    ...matter,
                    status: 'Active',
                    closedAt: undefined,
                  }
                : matter
            ),
          }));
        },

        // ============================================
        // Bulk Actions
        // ============================================

        bulkDeleteMatters: (ids) => {
          set((state) => ({
            matters: state.matters.filter((m) => !ids.includes(m.id)),
            selectedMatterId: ids.includes(state.selectedMatterId || '')
              ? null
              : state.selectedMatterId,
          }));
        },

        bulkCloseMatters: (ids) => {
          set((state) => ({
            matters: state.matters.map((matter) =>
              ids.includes(matter.id)
                ? {
                    ...matter,
                    status: 'Closed' as MatterStatus,
                    closedAt: new Date(),
                  }
                : matter
            ),
          }));
        },

        // ============================================
        // Reset
        // ============================================

        reset: () => {
          set({
            matters: mockMatters,
            selectedMatterId: null,
            filters: initialFilters,
            sorting: initialSorting,
            pagination: initialPagination,
          });
        },
      }),
      {
        name: 'atty-matter-storage',
        partialize: (state) => ({
          matters: state.matters,
          filters: state.filters,
          sorting: state.sorting,
        }),
      }
    ),
    { name: 'MatterStore' }
  )
);
