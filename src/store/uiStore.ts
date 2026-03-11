// UI Store - Zustand state management for UI state
// Handles modals, toasts, sidebar, and other UI-related state

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss after ms (0 = no auto-dismiss)
  position?: ToastPosition;
  createdAt: Date;
}

export type ModalType =
  | 'createMatter'
  | 'editMatter'
  | 'deleteMatter'
  | 'createTransaction'
  | 'allocateTransaction'
  | 'editRate'
  | 'createReport'
  | 'confirmPayoff'
  | 'bulkCloseMatters'
  | 'viewTransaction'
  | null;

export interface ModalState {
  type: ModalType;
  data?: any; // Additional data for the modal (e.g., matterId, transactionId)
  isOpen: boolean;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeItem: string;
}

// ============================================
// State Interface
// ============================================

export interface UIState {
  // Sidebar
  sidebar: SidebarState;

  // Modal
  modal: ModalState;

  // Toasts
  toasts: Toast[];

  // Loading states
  isGlobalLoading: boolean;
  loadingMessage?: string;

  // Other UI state
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;

  // Computed (getters)
  getActiveToastCount: () => number;
  getVisibleToasts: () => Toast[];

  // Sidebar Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  setActiveSidebarItem: (item: string) => void;

  // Modal Actions
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  setModalData: (data: any) => void;

  // Toast Actions
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
    position?: ToastPosition
  ) => string;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Loading Actions
  setGlobalLoading: (isLoading: boolean, message?: string) => void;

  // Theme Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Responsive Actions
  setMobile: (isMobile: boolean) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialSidebar: SidebarState = {
  isOpen: true,
  isCollapsed: false,
  activeItem: 'dashboard',
};

const initialModal: ModalState = {
  type: null,
  isOpen: false,
  data: undefined,
};

// ============================================
// Store Definition
// ============================================

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial data
      sidebar: initialSidebar,
      modal: initialModal,
      toasts: [],
      isGlobalLoading: false,
      loadingMessage: undefined,
      theme: 'light',
      isMobile: false,

      // ============================================
      // Getters / Computed State
      // ============================================

      getActiveToastCount: () => {
        return get().toasts.length;
      },

      getVisibleToasts: () => {
        return get().toasts.filter((toast) => {
          if (toast.duration === 0) return true; // Permanent toasts
          const elapsed = Date.now() - toast.createdAt.getTime();
          return elapsed < (toast.duration || 5000);
        });
      },

      // ============================================
      // Sidebar Actions
      // ============================================

      toggleSidebar: () => {
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            isOpen: !state.sidebar.isOpen,
          },
        }));
      },

      setSidebarOpen: (isOpen) => {
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            isOpen,
          },
        }));
      },

      setSidebarCollapsed: (isCollapsed) => {
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            isCollapsed,
          },
        }));
      },

      setActiveSidebarItem: (item) => {
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            activeItem: item,
          },
        }));
      },

      // ============================================
      // Modal Actions
      // ============================================

      openModal: (type, data) => {
        set({
          modal: {
            type,
            isOpen: true,
            data,
          },
        });
      },

      closeModal: () => {
        set({
          modal: {
            type: null,
            isOpen: false,
            data: undefined,
          },
        });
      },

      setModalData: (data) => {
        set((state) => ({
          modal: {
            ...state.modal,
            data,
          },
        }));
      },

      // ============================================
      // Toast Actions
      // ============================================

      showToast: (type, title, message, duration, position) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast: Toast = {
          id,
          type,
          title,
          message,
          duration: duration ?? 5000,
          position: position ?? 'top-right',
          createdAt: new Date(),
        };

        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        // Auto-dismiss after duration
        if (duration !== 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, duration ?? 5000);
        }

        return id;
      },

      showSuccess: (title, message) => {
        return get().showToast('success', title, message);
      },

      showError: (title, message) => {
        return get().showToast('error', title, message, 0); // Error toasts don't auto-dismiss
      },

      showWarning: (title, message) => {
        return get().showToast('warning', title, message);
      },

      showInfo: (title, message) => {
        return get().showToast('info', title, message);
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      // ============================================
      // Loading Actions
      // ============================================

      setGlobalLoading: (isLoading, message) => {
        set({
          isGlobalLoading: isLoading,
          loadingMessage: message,
        });
      },

      // ============================================
      // Theme Actions
      // ============================================

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },

      // ============================================
      // Responsive Actions
      // ============================================

      setMobile: (isMobile) => {
        set((state) => ({
          isMobile,
          // Auto-collapse sidebar on mobile
          sidebar: {
            ...state.sidebar,
            isOpen: isMobile ? false : state.sidebar.isOpen,
          },
        }));
      },

      // ============================================
      // Reset
      // ============================================

      reset: () => {
        set({
          sidebar: initialSidebar,
          modal: initialModal,
          toasts: [],
          isGlobalLoading: false,
          loadingMessage: undefined,
          theme: 'light',
          isMobile: false,
        });
      },
    }),
    { name: 'UIStore' }
  )
);

// ============================================
// Convenience Hooks for Common Modal Patterns
// ============================================

/**
 * Open create matter modal
 */
export const openCreateMatterModal = () => {
  useUIStore.getState().openModal('createMatter');
};

/**
 * Open edit matter modal
 */
export const openEditMatterModal = (matterId: string) => {
  useUIStore.getState().openModal('editMatter', { matterId });
};

/**
 * Open delete matter confirmation modal
 */
export const openDeleteMatterModal = (matterId: string) => {
  useUIStore.getState().openModal('deleteMatter', { matterId });
};

/**
 * Open create transaction modal
 */
export const openCreateTransactionModal = () => {
  useUIStore.getState().openModal('createTransaction');
};

/**
 * Open allocate transaction modal
 */
export const openAllocateTransactionModal = (transactionId: string) => {
  useUIStore.getState().openModal('allocateTransaction', { transactionId });
};

/**
 * Open view transaction modal
 */
export const openViewTransactionModal = (transactionId: string) => {
  useUIStore.getState().openModal('viewTransaction', { transactionId });
};

/**
 * Open edit rate modal
 */
export const openEditRateModal = (rateId?: string) => {
  useUIStore.getState().openModal('editRate', { rateId });
};

/**
 * Open create report modal
 */
export const openCreateReportModal = (reportType?: string) => {
  useUIStore.getState().openModal('createReport', { reportType });
};

/**
 * Open confirm payoff modal
 */
export const openConfirmPayoffModal = (matterId: string) => {
  useUIStore.getState().openModal('confirmPayoff', { matterId });
};

/**
 * Open bulk close matters modal
 */
export const openBulkCloseMattersModal = (matterIds: string[]) => {
  useUIStore.getState().openModal('bulkCloseMatters', { matterIds });
};
