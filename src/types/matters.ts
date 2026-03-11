// Types for Matters page and components

import { Matter } from './index';

// ============================================
// Filter State Types
// ============================================
export interface MattersFilterState {
  search: string;
  status: string;
  balanceMin?: number;
  balanceMax?: number;
}

// ============================================
// Sort Configuration Types
// ============================================
export interface MattersSortConfig {
  column: MattersSortColumn;
  direction: 'asc' | 'desc';
}

export type MattersSortColumn =
  | 'id'
  | 'clientName'
  | 'status'
  | 'principalBalance'
  | 'totalOwed'
  | 'createdAt';

// ============================================
// Pagination Types
// ============================================
export interface MattersPaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Summary Card Types
// ============================================
export interface MatterSummaryCard {
  label: string;
  value: string;
  valueNumeric?: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
}

// ============================================
// Form Types
// ============================================
export interface MatterFormData {
  id: string;
  clientName: string;
  status: 'Active' | 'Closed' | 'Archive';
  notes?: string;
}

export interface MatterFormErrors {
  id?: string;
  clientName?: string;
  notes?: string;
}

export interface MatterFormProps {
  initialData?: Partial<MatterFormData>;
  onSubmit: (data: MatterFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================
// Action Types
// ============================================
export type MatterRowAction = 'view' | 'edit' | 'close' | 'reports' | 'delete';
