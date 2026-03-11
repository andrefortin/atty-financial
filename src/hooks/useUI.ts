// Custom hook for UI state management
// Wraps Zustand uiStore with convenient selectors and actions

import { useCallback, useMemo } from 'react';
import {
  useUIStore,
  type UIState,
} from '../store';

/**
 * Hook: Get modal state
 * @returns Object with all modal state and controls
 */
export const useModal = () => {
  const modal = useUIStore((state) => state.modal);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const setModalData = useUIStore((state) => state.setModalData);

  return {
    modal,
    isOpen: modal.isOpen,
    type: modal.type,
    data: modal.data,
    openModal,
    closeModal,
    setModalData,
  };
};

/**
 * Hook: Get toast notifications
 * @returns Object with all toast state and controls
 */
export const useToasts = () => {
  const toasts = useUIStore((state) => state.toasts);
  const showToast = useUIStore((state) => state.showToast);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const showWarning = useUIStore((state) => state.showWarning);
  const showInfo = useUIStore((state) => state.showInfo);
  const dismissToast = useUIStore((state) => state.dismissToast);
  const clearToasts = useUIStore((state) => state.clearToasts);

  return {
    toasts,
    activeCount: toasts.length,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearToasts,
  };
};

/**
 * Hook: Get sidebar state
 * @returns Object with all sidebar state and controls
 */
export const useSidebar = () => {
  const sidebar = useUIStore((state) => state.sidebar);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const setActiveSidebarItem = useUIStore((state) => state.setActiveSidebarItem);

  return {
    sidebar,
    isOpen: sidebar.isOpen,
    isCollapsed: sidebar.isCollapsed,
    activeItem: sidebar.activeItem,
    toggleSidebar,
    setSidebarOpen,
    setSidebarCollapsed,
    setActiveSidebarItem,
  };
};

/**
 * Hook: Get global loading state
 * @returns Object with loading state and controls
 */
export const useGlobalLoading = () => {
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  return {
    isLoading: isGlobalLoading,
    loadingMessage: useUIStore((state) => state.loadingMessage),
    setGlobalLoading,
  };
};

/**
 * Hook: Get theme state
 * @returns Object with theme state and controls
 */
export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: theme === 'system',
    setTheme,
  };
};

/**
 * Hook: Get mobile/responsive state
 * @returns Object with mobile state and controls
 */
export const useResponsive = () => {
  const isMobile = useUIStore((state) => state.isMobile);
  const setMobile = useUIStore((state) => state.setMobile);

  return {
    isMobile,
    setMobile,
  };
};

/**
 * Hook: Get all UI state combined
 * @returns Object with all UI state
 */
export const useUIState = () => {
  const uiStore = useUIStore();

  return useMemo(
    () => ({
      modal: uiStore.modal,
      sidebar: uiStore.sidebar,
      toasts: uiStore.toasts,
      isGlobalLoading: uiStore.isGlobalLoading,
      loadingMessage: uiStore.loadingMessage,
      theme: uiStore.theme,
      isMobile: uiStore.isMobile,
    }),
    [uiStore]
  );
};

/**
 * Hook: Open specific modals by type
 * @returns Functions to open common modals
 */
export const useModalActions = () => {
  const openModal = useUIStore((state) => state.openModal);

  return {
    openCreateMatterModal: () => openModal('createMatter'),
    openEditMatterModal: (matterId: string) => openModal('editMatter', { matterId }),
    openDeleteMatterModal: (matterId: string) => openModal('deleteMatter', { matterId }),
    openCreateTransactionModal: () => openModal('createTransaction'),
    openAllocateTransactionModal: (transactionId: string) => openModal('allocateTransaction', { transactionId }),
    openViewTransactionModal: (transactionId: string) => openModal('viewTransaction', { transactionId }),
    openEditRateModal: (rateId?: string) => openModal('editRate', { rateId }),
    openCreateReportModal: (reportType?: string) => openModal('createReport', { reportType }),
    openConfirmPayoffModal: (matterId: string) => openModal('confirmPayoff', { matterId }),
    openBulkCloseMattersModal: (matterIds: string[]) => openModal('bulkCloseMatters', { matterIds }),
  };
};
