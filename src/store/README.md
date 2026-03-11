# Zustand Store Setup - Phase 2

This directory contains the Zustand state management layer for the ATTY Financial application.

## Overview

The store is organized into four main stores:

1. **matterStore** - Matter state management with CRUD, filters, sorting, pagination
2. **transactionStore** - Transaction state management with allocation support
3. **firmStore** - Firm/settings and rate calendar state
4. **uiStore** - UI state for modals, toasts, sidebar

All stores include:
- DevTools middleware for debugging
- Persist middleware for data persistence
- Computed getters for derived state
- Full CRUD operations
- Filter, sort, and pagination support

## Store Structure

```
src/store/
├── index.ts           # Store exports and composition
├── matterStore.ts     # Matter state management
├── transactionStore.ts # Transaction state management
├── firmStore.ts       # Firm and rate calendar state
├── uiStore.ts         # UI state management
├── example.ts         # Usage examples
└── README.md          # This file
```

## Installation

Zustand is already installed in the project:

```bash
npm install zustand
```

## Quick Start

### Initialize Stores

```typescript
import { initializeStores } from './store';

// Initialize all stores on app startup
initializeStores();
```

### Using a Store

```typescript
import { useMatterStore } from './store';

// In a component
function MattersList() {
  const matters = useMatterStore(state => state.getPaginatedMatters());
  const totalBalance = useMatterStore(state => state.getTotalPrincipalBalance());

  return (
    <div>
      <h2>Total Balance: ${totalBalance.toFixed(2)}</h2>
      {matters.map(matter => (
        <div key={matter.id}>{matter.clientName}</div>
      ))}
    </div>
  );
}

// Outside components (direct access)
const matter = useMatterStore.getState().getMatterById('JON-2024-001');
```

## Store Details

### matterStore

Manages all matter-related state and operations.

**Key Features:**
- Full CRUD for matters
- Filter by status, search query, balance, overdue status
- Sort by client name, date, amounts, status
- Pagination support
- Computed state (active matters, overdue matters, totals)

**Key Actions:**
```typescript
// CRUD
createMatter(input: CreateMatterInput): Matter
updateMatter(id: string, input: UpdateMatterInput): void
deleteMatter(id: string): void
closeMatter(id: string): void
reopenMatter(id: string): void

// Filter/Sort/Pagination
setFilters(filters: Partial<MatterFilters>): void
setSorting(sorting: Partial<MatterSorting>): void
setPagination(pagination: Partial<MatterPagination>): void

// Getters
getFilteredMatters(): Matter[]
getSortedMatters(): Matter[]
getPaginatedMatters(): Matter[]
getActiveMatters(): Matter[]
getOverdueMatters(): Matter[]
getTotalPrincipalBalance(): number
getTotalInterestAccrued(): number
getActiveMattersCount(): number
```

**Example:**
```typescript
// Filter active matters with balance
useMatterStore.getState().setFilters({
  status: 'Active',
  hasBalance: true,
  searchQuery: 'Smith',
});

// Sort by total owed (highest first)
useMatterStore.getState().setSorting({
  field: 'totalOwed',
  direction: 'desc',
});

// Create a new matter
const newMatter = useMatterStore.getState().createMatter({
  id: 'NEW-2024-001',
  clientName: 'Jane Doe',
  notes: 'New case',
});
```

### transactionStore

Manages all transaction-related state and allocation operations.

**Key Features:**
- Full CRUD for transactions
- Transaction allocation to matters
- Filter by type, status, matter, date range, category
- Auto-assign status based on allocations
- Matter-specific transaction totals

**Key Actions:**
```typescript
// CRUD
createTransaction(input: CreateTransactionInput): Transaction
updateTransaction(id: string, updates: Partial<Transaction>): void
deleteTransaction(id: string): void

// Allocation
allocateTransaction(transactionId: string, allocations: Allocation[]): void
unallocateTransaction(transactionId: string): void
updateAllocation(transactionId: string, allocations: Allocation[]): void

// Filter/Sort/Pagination
setFilters(filters: Partial<TransactionFilters>): void
setSorting(sorting: Partial<TransactionSorting>): void
setPagination(pagination: Partial<TransactionPagination>): void

// Getters
getFilteredTransactions(): Transaction[]
getUnassignedTransactions(): Transaction[]
getTransactionsByMatterId(matterId: string): Transaction[]
getRecentTransactions(limit?: number): Transaction[]
getTotalDraws(): number
getMatterTotalDraws(matterId: string): number
```

**Example:**
```typescript
// Create a new draw transaction
const transaction = useTransactionStore.getState().createTransaction({
  date: new Date(),
  type: 'Draw',
  category: 'Court & Filing Fees',
  amount: 500,
  description: 'Filing fees',
  allocations: [
    { matterId: 'JON-2024-001', amount: 500 },
  ],
});

// Allocate an unassigned transaction
useTransactionStore.getState().allocateTransaction('TXN-001', [
  {
    matterId: 'JON-2024-001',
    matterName: 'Johnathan Smithson',
    amount: 2500,
  },
]);

// Filter transactions
useTransactionStore.getState().setFilters({
  type: 'Draw',
  status: 'Unassigned',
  dateFrom: new Date('2024-01-01'),
});
```

### firmStore

Manages firm settings, line of credit, and rate calendar.

**Key Features:**
- Firm profile and settings
- Line of credit tracking
- Rate calendar with historical rates
- Current effective rate calculation
- Compliance certification tracking

**Key Actions:**
```typescript
// Firm settings
updateFirm(updates: Partial<Firm>): void
updateFirmSettings(settings: Partial<FirmSettings>): void
updatePrimeRateModifier(modifier: number): void
updateLineOfCreditLimit(limit: number): void
setComplianceCertified(certified: boolean, certifiedBy?: string): void

// Rate calendar
addRateEntry(entry: Omit<RateEntry, 'id' | 'totalRate' | 'createdAt'>): RateEntry
updateRateEntry(id: string, updates: Partial<RateEntry>): void
deleteRateEntry(id: string): void
setCurrentRate(primeRate: number, notes?: string): void

// Getters
getCurrentRate(): RateEntry | undefined
getRateForDate(date: Date): RateEntry | undefined
getEffectiveRate(): number
getLineOfCreditRemaining(): number
getLineOfCreditUsed(): number
getLineOfCreditUsagePercentage(): number
```

**Example:**
```typescript
// Update firm settings
useFirmStore.getState().updateFirmSettings({
  dayCountConvention: 'ACT/365',
  roundingMethod: 'Bankers',
});

// Add a new rate entry
const rate = useFirmStore.getState().addRateEntry({
  effectiveDate: new Date(),
  primeRate: 8.75,
  modifier: 2.5,
  source: 'Federal Reserve',
  notes: 'Rate update',
});

// Get credit usage info
const remaining = useFirmStore.getState().getLineOfCreditRemaining();
const usagePercentage = useFirmStore.getState().getLineOfCreditUsagePercentage();
```

### uiStore

Manages UI-related state including modals, toasts, sidebar, and loading state.

**Key Features:**
- Toast notifications with auto-dismiss
- Modal management with typed modals
- Sidebar state (open/collapsed/active item)
- Global loading state
- Theme management

**Key Actions:**
```typescript
// Toast notifications
showToast(type, title, message?, duration?, position?): string
showSuccess(title, message?): string
showError(title, message?): string
showWarning(title, message?): string
showInfo(title, message?): string
dismissToast(id: string): void
clearToasts(): void

// Modal management
openModal(type: ModalType, data?: any): void
closeModal(): void
setModalData(data: any): void

// Sidebar
toggleSidebar(): void
setSidebarOpen(isOpen: boolean): void
setSidebarCollapsed(isCollapsed: boolean): void
setActiveSidebarItem(item: string): void

// Loading
setGlobalLoading(isLoading: boolean, message?: string): void
```

**Example:**
```typescript
// Show toast notifications
useUIStore.getState().showSuccess('Success!', 'Operation completed');
useUIStore.getState().showError('Error', 'Something went wrong');
useUIStore.getState().showInfo('Info', 'New updates available');

// Open a modal
useUIStore.getState().openModal('createMatter');
useUIStore.getState().openModal('editMatter', { matterId: 'JON-2024-001' });

// Toggle sidebar
useUIStore.getState().toggleSidebar();
useUIStore.getState().setActiveSidebarItem('matters');

// Show loading state
useUIStore.getState().setGlobalLoading(true, 'Saving...');
// ... perform operation ...
useUIStore.getState().setGlobalLoading(false);
```

## Convenience Functions

The `uiStore` exports convenience functions for common modal patterns:

```typescript
import {
  openCreateMatterModal,
  openEditMatterModal,
  openDeleteMatterModal,
  openCreateTransactionModal,
  openAllocateTransactionModal,
  openViewTransactionModal,
  openEditRateModal,
  openCreateReportModal,
  openConfirmPayoffModal,
  openBulkCloseMattersModal,
} from './store';

// Usage
openCreateMatterModal();
openEditMatterModal('JON-2024-001');
openDeleteMatterModal('JON-2024-001');
```

## Store Composition

You can use multiple stores together:

```typescript
import { useMatterStore, useTransactionStore, useFirmStore, useUIStore } from './store';

export function getDashboardSummary() {
  const totalBalance = useMatterStore.getState().getTotalPrincipalBalance();
  const activeMatters = useMatterStore.getState().getActiveMattersCount();
  const currentRate = useFirmStore.getState().getEffectiveRate();
  const unassignedTransactions = useTransactionStore.getState().getUnassignedTransactions().length;

  return { totalBalance, activeMatters, currentRate, unassignedTransactions };
}
```

## Persistence

All stores use the `persist` middleware to save state to localStorage:

- **matterStore**: Persists matters, filters, and sorting
- **transactionStore**: Persists transactions, filters, and sorting
- **firmStore**: Persists firm, rate calendar, and interest allocations
- **uiStore**: Not persisted (transient UI state)

To reset stores to initial state:

```typescript
import { resetAllStores } from './store';

resetAllStores();
```

## Best Practices

1. **Use selectors in components** to avoid unnecessary re-renders:
   ```typescript
   // Good - only re-renders when paginatedMatters changes
   const matters = useMatterStore(state => state.getPaginatedMatters());

   // Avoid - re-renders on any store change
   const { getPaginatedMatters } = useMatterStore();
   const matters = getPaginatedMatters();
   ```

2. **Combine related state** in one selector call:
   ```typescript
   // Good
   const { matters, filters, pagination } = useMatterStore(state => ({
     matters: state.getPaginatedMatters(),
     filters: state.filters,
     pagination: state.pagination,
   }));
   ```

3. **Use direct state access outside components**:
   ```typescript
   // In event handlers or outside React
   useMatterStore.getState().createMatter({ id: '...', clientName: '...' });
   ```

4. **Initialize stores once** on app startup:
   ```typescript
   // In main.tsx or App.tsx
   import { initializeStores } from './store';
   initializeStores();
   ```

## DevTools

All stores have DevTools enabled. Open Redux DevTools extension to:
- Inspect state
- Time-travel debug
- Dispatch actions
- Track state changes

## Type Safety

All stores are fully typed with TypeScript. Types are exported from `index.ts`:

```typescript
import type {
  MatterState,
  MatterFilters,
  MatterSorting,
  TransactionState,
  FirmState,
  UIState,
  ModalType,
  Toast,
} from './store';
```

## Testing

See `example.ts` for comprehensive usage examples covering all stores and common patterns.

## Migration Notes

This is Phase 2 of the implementation. Future phases will:
- Add more advanced computed state
- Implement store cross-communication
- Add middleware for logging and analytics
- Implement optimistic updates
- Add data synchronization with backend
