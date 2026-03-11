// Store exports and composition
// This file exports all stores and provides a single entry point for state management layer

export { useMatterStore } from './matterStore';
export { useTransactionStore } from './transactionStore';
export { useFirmStore } from './firmStore';
export { useUIStore } from './uiStore';
export { useAllocationStore } from './allocationStore';

// Re-export types for convenience
export type {
  MatterState,
  MatterFilters,
  MatterSorting,
  MatterPagination,
} from './matterStore';

export type {
  TransactionState,
  TransactionFilters,
  TransactionSorting,
  TransactionPagination,
} from './transactionStore';

export type {
  FirmState,
} from './firmStore';

export type {
  UIState,
  Toast,
  ModalState,
} from './uiStore';

export type {
  AllocationState,
  AllocationFilters,
  AllocationSorting,
  AllocationPagination,
  AllocationMethod,
  AllocationMethodConfig,
} from './allocationStore';

// Re-export UI store functions for convenience
export {
  openCreateReportModal,
  openCreateMatterModal,
  openEditMatterModal,
  openEditRateModal,
  openViewTransactionModal,
  openCreateTransactionModal,
  openAllocateTransactionModal,
  openConfirmPayoffModal,
  openBulkCloseMattersModal,
} from './uiStore';
