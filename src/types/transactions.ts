// Types for Transactions page and components

import { Transaction, TransactionType, ExpenseCategory, PaymentCategory, TransactionStatus, TransactionAllocation } from './index';
import { Matter } from './index';

// ============================================
// Filter State Types
// ============================================
export interface TransactionsFilterState {
  dateFrom?: Date;
  dateTo?: Date;
  type: string;
  category: string;
  status: string;
  matterId: string;
  search: string;
}

// ============================================
// Sort Configuration Types
// ============================================
export interface TransactionsSortConfig {
  column: TransactionsSortColumn;
  direction: 'asc' | 'desc';
}

export type TransactionsSortColumn =
  | 'date'
  | 'type'
  | 'category'
  | 'amount'
  | 'status'
  | 'description';

// ============================================
// Pagination Types
// ============================================
export interface TransactionsPaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Allocation State Types
// ============================================
export interface AllocationState {
  allocations: AllocationItem[];
  totalAllocated: number;
  unallocated: number;
  isValid: boolean;
}

export interface AllocationItem {
  matterId: string;
  matterName: string;
  amount: number;
}

// ============================================
// Modal Types
// ============================================
export type TransactionModalType = 'allocate' | 'create' | 'edit' | 'detail' | null;

export interface TransactionModalState {
  type: TransactionModalType;
  transaction?: Transaction;
  isOpen: boolean;
}

// ============================================
// Form Types
// ============================================
export interface TransactionFormData {
  id?: string;
  date: Date;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  allocations?: Array<{
    matterId: string;
    amount: number;
  }>;
}

export interface TransactionFormErrors {
  date?: string;
  type?: string;
  category?: string;
  amount?: string;
  description?: string;
  allocations?: string;
}

// ============================================
// Row Actions Types
// ============================================
export type TransactionRowAction = 'allocate' | 'view' | 'edit' | 'delete';

// ============================================
// Selection Types
// ============================================
export interface TransactionSelectionState {
  selectedIds: Set<string>;
  allSelected: boolean;
}

// ============================================
// Helper Types
// ============================================
export interface CategoryGroup {
  type: 'expense' | 'payment';
  categories: string[];
}

// Constants moved to utils/constants.ts and imported from there

import { Transaction, TransactionType, ExpenseCategory, PaymentCategory, TransactionStatus, TransactionAllocation } from './index';
import { Matter } from './index';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_CATEGORIES,
  INTEREST_CATEGORY,
} from '../utils/constants';
