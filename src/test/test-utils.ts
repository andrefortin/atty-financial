// ============================================
// Test Utilities
// ============================================

// Mock store initialization
export const initializeTestStores = () => {
  // Clear any stored data
  localStorage.clear();
};

// Create mock dates
export const createMockDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};

export const mockToday = createMockDate(2024, 3, 15);
export const mockYesterday = createMockDate(2024, 3, 14);
export const mockLastMonth = createMockDate(2024, 2, 15);

// Mock matter data
export const mockMatter = {
  id: 'TEST-MATTER-001',
  caseNumber: 'TEST-2024-001',
  clientName: 'Test Client',
  principalBalance: 100000,
  interestOwed: 5000,
  interestRate: 8.5,
  createdAt: mockLastMonth,
  lastActivity: mockYesterday,
  status: 'Active' as const,
  alerts: [],
};

// Mock transaction data
export const mockTransaction = {
  id: 'TEST-TXN-001',
  date: mockToday,
  type: 'Draw' as const,
  category: 'Funding',
  amount: 50000,
  netAmount: 50000,
  status: 'Allocated' as const,
  description: 'Test Draw',
  createdAt: mockToday,
  allocations: [
    {
      matterId: 'TEST-MATTER-001',
      matterName: 'Test Client',
      amount: 50000,
    },
  ],
};

// Mock allocation data
export const mockAllocation = {
  id: 'TEST-ALLOC-001',
  autodraftId: 'TEST-TXN-002',
  autodraftDate: mockToday,
  totalAmount: 5000,
  allocations: [
    {
      matterId: 'TEST-MATTER-001',
      matterName: 'Test Client',
      allocatedAmount: 2500,
      interestRemainingBefore: 5000,
      interestRemainingAfter: 2500,
      tier: 2 as const,
    },
    {
      matterId: 'TEST-MATTER-002',
      matterName: 'Another Client',
      allocatedAmount: 2500,
      interestRemainingBefore: 3000,
      interestRemainingAfter: 500,
      tier: 2 as const,
    },
  ],
  carryForward: 0,
  executedAt: mockToday,
};

// Wait for async operations
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Create a spy on console methods
export const spyOnConsole = (method: 'log' | 'warn' | 'error') => {
  const original = console[method];
  const spy = jest.fn();
  console[method] = spy;
  return {
    spy,
    restore: () => {
      console[method] = original;
      spy.mockRestore();
    },
  };
};

// Mock store getters
export const mockGetActiveMatters = jest.fn(() => [mockMatter]);
export const mockGetMatterById = jest.fn((id: string) =>
  id === 'TEST-MATTER-001' ? mockMatter : undefined
);
