// Example usage of the Zustand stores
// This file demonstrates how to use the various stores

import { useMatterStore, useTransactionStore, useFirmStore, useUIStore } from './index';

// ============================================
// Matter Store Examples
// ============================================

// Example 1: Get filtered, sorted, and paginated matters
export const exampleGetMatters = () => {
  const filtered = useMatterStore.getState().getFilteredMatters();
  const sorted = useMatterStore.getState().getSortedMatters();
  const paginated = useMatterStore.getState().getPaginatedMatters();
  const activeMatters = useMatterStore.getState().getActiveMatters();
  const overdueMatters = useMatterStore.getState().getOverdueMatters();

  console.log({ filtered, sorted, paginated, activeMatters, overdueMatters });
};

// Example 2: Filter matters
export const exampleFilterMatters = () => {
  useMatterStore.getState().setFilters({
    status: 'Active',
    searchQuery: 'Smith',
    hasBalance: true,
  });
};

// Example 3: Sort matters
export const exampleSortMatters = () => {
  useMatterStore.getState().setSorting({
    field: 'totalOwed',
    direction: 'desc',
  });
};

// Example 4: Paginate matters
export const examplePaginateMatters = () => {
  useMatterStore.getState().setPagination({
    page: 2,
    pageSize: 25,
  });
};

// Example 5: CRUD operations
export const exampleCreateMatter = () => {
  const newMatter = useMatterStore.getState().createMatter({
    id: 'NEW-2024-001',
    clientName: 'Jane Doe',
    notes: 'New case',
  });
  console.log('Created matter:', newMatter);
};

export const exampleUpdateMatter = () => {
  useMatterStore.getState().updateMatter('JON-2024-001', {
    clientName: 'Johnathan Smithson Jr.',
    notes: 'Updated notes',
  });
};

export const exampleCloseMatter = () => {
  useMatterStore.getState().closeMatter('JON-2024-001');
};

export const exampleDeleteMatter = () => {
  useMatterStore.getState().deleteMatter('JON-2024-001');
};

// Example 6: Computed state
export const exampleComputedState = () => {
  const totalBalance = useMatterStore.getState().getTotalPrincipalBalance();
  const totalInterest = useMatterStore.getState().getTotalInterestAccrued();
  const activeCount = useMatterStore.getState().getActiveMattersCount();

  console.log({ totalBalance, totalInterest, activeCount });
};

// ============================================
// Transaction Store Examples
// ============================================

// Example 1: Get filtered transactions
export const exampleGetTransactions = () => {
  const unassigned = useTransactionStore.getState().getUnassignedTransactions();
  const draws = useTransactionStore.getState().getDrawTransactions();
  const recent = useTransactionStore.getState().getRecentTransactions(5);

  console.log({ unassigned, draws, recent });
};

// Example 2: Filter transactions
export const exampleFilterTransactions = () => {
  useTransactionStore.getState().setFilters({
    type: 'Draw',
    status: 'Unassigned',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-03-31'),
  });
};

// Example 3: Create transaction
export const exampleCreateTransaction = () => {
  const newTransaction = useTransactionStore.getState().createTransaction({
    date: new Date(),
    type: 'Draw',
    category: 'Court & Filing Fees',
    amount: 500,
    description: 'Filing fees',
    allocations: [
      { matterId: 'JON-2024-001', amount: 500 },
    ],
  });
  console.log('Created transaction:', newTransaction);
};

// Example 4: Allocate transaction
export const exampleAllocateTransaction = () => {
  useTransactionStore.getState().allocateTransaction('TXN-2024-03-20-001', [
    {
      matterId: 'JON-2024-001',
      matterName: 'Johnathan Smithson',
      amount: 2500,
    },
  ]);
};

// Example 5: Get transactions by matter
export const exampleGetMatterTransactions = () => {
  const matterTransactions = useTransactionStore.getState().getTransactionsByMatterId('JON-2024-001');
  const totalDraws = useTransactionStore.getState().getMatterTotalDraws('JON-2024-001');
  const totalPayments = useTransactionStore.getState().getMatterTotalPayments('JON-2024-001');

  console.log({ matterTransactions, totalDraws, totalPayments });
};

// ============================================
// Firm Store Examples
// ============================================

// Example 1: Get firm information
export const exampleGetFirmInfo = () => {
  const firm = useFirmStore.getState().firm;
  const currentRate = useFirmStore.getState().getCurrentRate();
  const effectiveRate = useFirmStore.getState().getEffectiveRate();
  const creditRemaining = useFirmStore.getState().getLineOfCreditRemaining();
  const creditUsage = useFirmStore.getState().getLineOfCreditUsagePercentage();

  console.log({ firm, currentRate, effectiveRate, creditRemaining, creditUsage });
};

// Example 2: Update firm settings
export const exampleUpdateFirmSettings = () => {
  useFirmStore.getState().updateFirmSettings({
    dayCountConvention: 'ACT/365',
    roundingMethod: 'Bankers',
  });
};

// Example 3: Add rate entry
export const exampleAddRateEntry = () => {
  const newRate = useFirmStore.getState().addRateEntry({
    effectiveDate: new Date(),
    primeRate: 8.75,
    modifier: 2.5,
    source: 'Federal Reserve',
    notes: 'Rate update',
  });
  console.log('Added rate entry:', newRate);
};

// Example 4: Update prime rate modifier
export const exampleUpdatePrimeModifier = () => {
  useFirmStore.getState().updatePrimeRateModifier(3.0);
};

// ============================================
// UI Store Examples
// ============================================

// Example 1: Show toast notifications
export const exampleShowToasts = () => {
  const uiStore = useUIStore.getState();

  const successId = uiStore.showSuccess('Success!', 'Operation completed');
  const errorId = uiStore.showError('Error', 'Something went wrong');
  const warningId = uiStore.showWarning('Warning', 'Please check your input');
  const infoId = uiStore.showInfo('Info', 'New updates available');

  console.log('Toast IDs:', { successId, errorId, warningId, infoId });
};

// Example 2: Open/close modals
export const exampleModals = () => {
  const uiStore = useUIStore.getState();

  // Open create matter modal
  uiStore.openModal('createMatter');

  // Open edit matter modal with data
  uiStore.openModal('editMatter', { matterId: 'JON-2024-001' });

  // Close modal
  uiStore.closeModal();
};

// Example 3: Toggle sidebar
export const exampleSidebar = () => {
  const uiStore = useUIStore.getState();

  uiStore.toggleSidebar();
  uiStore.setSidebarCollapsed(true);
  uiStore.setActiveSidebarItem('matters');
};

// Example 4: Global loading state
export const exampleLoading = () => {
  const uiStore = useUIStore.getState();

  uiStore.setGlobalLoading(true, 'Saving data...');

  // ... perform async operation ...

  uiStore.setGlobalLoading(false);
};

// ============================================
// React Component Example
// ============================================

/*
export const MattersList = () => {
  const matters = useMatterStore(state => state.getPaginatedMatters());
  const filters = useMatterStore(state => state.filters);
  const pagination = useMatterStore(state => state.pagination);
  const setFilters = useMatterStore(state => state.setFilters);
  const setPagination = useMatterStore(state => state.setPagination);

  return (
    <div>
      <h2>Matters ({matters.length})</h2>
      <ul>
        {matters.map(matter => (
          <li key={matter.id}>
            {matter.clientName} - ${matter.totalOwed.toFixed(2)}
          </li>
        ))}
      </ul>
      <button onClick={() => setPagination({ page: pagination.page - 1 })}>
        Previous
      </button>
      <span>Page {pagination.page}</span>
      <button onClick={() => setPagination({ page: pagination.page + 1 })}>
        Next
      </button>
    </div>
  );
};
*/

// ============================================
// Store Composition Example
// ============================================

// Example: Using multiple stores together
export const exampleStoreComposition = () => {
  const matterStore = useMatterStore.getState();
  const transactionStore = useTransactionStore.getState();
  const firmStore = useFirmStore.getState();
  const uiStore = useUIStore.getState();

  // Get dashboard summary
  const totalBalance = matterStore.getTotalPrincipalBalance();
  const activeMatters = matterStore.getActiveMattersCount();
  const currentRate = firmStore.getEffectiveRate();
  const unassignedTransactions = transactionStore.getUnassignedTransactions().length;

  // Show summary toast
  uiStore.showInfo(
    'Dashboard Summary',
    `${activeMatters} active matters, $${totalBalance.toFixed(2)} total balance, ` +
    `${currentRate.toFixed(2)}% rate, ${unassignedTransactions} unassigned transactions`
  );

  return { totalBalance, activeMatters, currentRate, unassignedTransactions };
};

// ============================================
// Initialize all stores
// ============================================

import { initializeStores } from './index';

export const exampleInitialize = () => {
  initializeStores();
  console.log('All stores initialized');
};
