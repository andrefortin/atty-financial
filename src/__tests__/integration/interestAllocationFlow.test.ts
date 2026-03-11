// ============================================
// Integration Tests - Interest Allocation Flow
// ============================================

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InterestAllocationPage } from '../../pages/InterestAllocation';
import {
  useAllocationStore,
  useTransactionStore,
  useMatterStore,
} from '../../store';
import {
  createAllocationRequest,
  executeAllocation,
} from '../../services/allocationStore';

// ============================================
// Setup
// ============================================

const renderWithProviders = () => {
  return render(<InterestAllocationPage />);
};

describe('Interest Allocation Flow Integration', () => {
  beforeEach(() => {
    // Clear stores
    useAllocationStore.getState().reset();
    useTransactionStore.getState().reset();
    useMatterStore.getState().reset();

    // Reset local storage
    localStorage.clear();
  });

  // ============================================
  // End-to-End Flow Tests
  // ============================================

  describe('Complete Allocation Flow', () => {
    it('should navigate through allocation tabs', async () => {
      renderWithProviders();

      // Initial tab should be Allocate
      expect(screen.getByText(/Allocate/i)).toBeInTheDocument();

      // Click on History tab
      const historyTab = screen.getByText(/History/i);
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/Allocation History/i)).toBeInTheDocument();
      });

      // Click on Review tab
      const reviewTab = screen.getByText(/Review/i);
      fireEvent.click(reviewTab);

      await waitFor(() => {
        expect(screen.getByText(/Allocation Review/i)).toBeInTheDocument();
      });

      // Back to Allocate tab
      const allocateTab = screen.getByText(/Allocate/i);
      fireEvent.click(allocateTab);

      await waitFor(() => {
        expect(screen.getByText(/Autodraft/i)).toBeInTheDocument();
      });
    });

    it('should create allocation request and execute it', async () => {
      renderWithProviders();

      // Navigate to Allocate tab
      const allocateTab = screen.getByText(/Allocate/i);
      fireEvent.click(allocateTab);

      await waitFor(() => {
        expect(screen.getByText(/Autodraft Transactions/i)).toBeInTheDocument();
      });

      // Select an autodraft transaction
      const autodraftCheckboxes = screen.getAllByRole('checkbox');
      if (autodraftCheckboxes.length > 0) {
        fireEvent.click(autodraftCheckboxes[0]);
      }

      // Select allocation method
      const methodSelect = screen.getByLabelText(/Allocation Method/i);
      if (methodSelect) {
        fireEvent.change(methodSelect, { target: { value: 'waterfall' } });
      }

      // Generate preview
      const previewButton = screen.getByText(/Generate Preview/i);
      if (previewButton) {
        fireEvent.click(previewButton);

        await waitFor(() => {
          expect(screen.getByText(/Allocation Preview/i)).toBeInTheDocument();
        });
      }

      // Execute allocation
      const executeButton = screen.getByText(/Execute Allocation/i);
      if (executeButton) {
        fireEvent.click(executeButton);

        await waitFor(() => {
          expect(screen.getByText(/Allocation Executed/i)).toBeInTheDocument();
        });
      }
    });

    it('should display allocation history', async () => {
      renderWithProviders();

      // Navigate to History tab
      const historyTab = screen.getByText(/History/i);
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/Allocation History/i)).toBeInTheDocument();
      });

      // Check for history table or empty state
      const historyTable = screen.queryByRole('table');
      const emptyState = screen.queryByText(/No allocations/i);

      if (historyTable) {
        expect(historyTable).toBeInTheDocument();
      } else {
        expect(emptyState).toBeInTheDocument();
      }
    });

    it('should display allocation review summary', async () => {
      renderWithProviders();

      // Navigate to Review tab
      const reviewTab = screen.getByText(/Review/i);
      fireEvent.click(reviewTab);

      await waitFor(() => {
        expect(screen.getByText(/Allocation Review/i)).toBeInTheDocument();
      });

      // Check for review summary cards
      const summaryCards = screen.queryAllByRole('article');
      expect(summaryCards.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Store Integration Tests
  // ============================================

  describe('Store Integration', () => {
    it('should integrate with Transaction store for autodrafts', async () => {
      renderWithProviders();

      // Add test autodraft transaction
      const autodraft = {
        id: 'AUTODRAFT-001',
        date: new Date(),
        type: 'Autodraft',
        category: 'Interest',
        amount: -5000,
        netAmount: -5000,
        status: 'Unassigned',
        description: 'Monthly Interest',
        createdAt: new Date(),
        allocations: [],
      };

      useTransactionStore.getState().addTransaction(autodraft);

      await waitFor(() => {
        expect(screen.getByText('Monthly Interest')).toBeInTheDocument();
      });
    });

    it('should integrate with Matter store for allocation', async () => {
      renderWithProviders();

      // Add test matter
      const matter = {
        id: 'MATTER-001',
        caseNumber: 'TEST-001',
        clientName: 'Test Client',
        principalBalance: 100000,
        interestOwed: 5000,
        interestRate: 8.5,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'Active',
        alerts: [],
      };

      useMatterStore.getState().addMatter(matter);

      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });
    });

    it('should integrate with Allocation store for history', async () => {
      renderWithProviders();

      // Add test allocation
      const allocation = {
        id: 'ALLOC-001',
        autodraftId: 'AUTODRAFT-001',
        autodraftDate: new Date(),
        totalAmount: 5000,
        allocations: [
          {
            matterId: 'MATTER-001',
            matterName: 'Test Client',
            allocatedAmount: 5000,
            interestRemainingBefore: 10000,
            interestRemainingAfter: 5000,
            tier: 1,
          },
        ],
        carryForward: 0,
        executedAt: new Date(),
      };

      useAllocationStore.getState().allocations.push(allocation);

      // Navigate to History tab
      const historyTab = screen.getByText(/History/i);
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('ALLOC-001')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Waterfall Allocation Tests
  // ============================================

  describe('Waterfall Allocation Flow', () => {
    it('should allocate interest using waterfall method correctly', async () => {
      renderWithProviders();

      // Create test matters with different balances
      const matters = [
        {
          id: 'MATTER-001',
          caseNumber: 'TEST-001',
          clientName: 'Client A',
          principalBalance: 0,
          interestOwed: 10000,
          interestRate: 8.5,
          createdAt: new Date(),
          lastActivity: new Date(),
          status: 'Active',
          alerts: [],
        },
        {
          id: 'MATTER-002',
          caseNumber: 'TEST-002',
          clientName: 'Client B',
          principalBalance: 50000,
          interestOwed: 20000,
          interestRate: 9.0,
          createdAt: new Date(),
          lastActivity: new Date(),
          status: 'Active',
          alerts: [],
        },
        {
          id: 'MATTER-003',
          caseNumber: 'TEST-003',
          clientName: 'Client C',
          principalBalance: 100000,
          interestOwed: 30000,
          interestRate: 8.0,
          createdAt: new Date(),
          lastActivity: new Date(),
          status: 'Active',
          alerts: [],
        },
      ];

      matters.forEach((matter) => {
        useMatterStore.getState().addMatter(matter);
      });

      // Create allocation request with waterfall method
      const request = {
        autodraftId: 'AUTODRAFT-001',
        method: 'waterfall',
        dateRange: {
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
      };

      useAllocationStore.getState().createAllocationRequest(request);

      // Generate preview
      await waitFor(() => {
        const preview = useAllocationStore.getState().allocationPreview;
        expect(preview).not.toBeNull();
        expect(preview?.method).toBe('waterfall');
      });

      // Verify waterfall allocation logic
      const preview = useAllocationStore.getState().allocationPreview;
      const tier1Allocations = preview?.allocations.filter(a => a.tier === 1);

      expect(tier1Allocations?.length).toBeGreaterThan(0);
      tier1Allocations?.forEach((allocation) => {
        const matter = matters.find(m => m.id === allocation.matterId);
        expect(matter?.principalBalance).toBe(0);
      });
    });

    it('should handle carry forward amount correctly', async () => {
      renderWithProviders();

      // Add matters with interest
      const matters = [
        {
          id: 'MATTER-001',
          caseNumber: 'TEST-001',
          clientName: 'Client A',
          principalBalance: 100000,
          interestOwed: 5000,
          interestRate: 8.5,
          createdAt: new Date(),
          lastActivity: new Date(),
          status: 'Active',
          alerts: [],
        },
      ];

      matters.forEach((matter) => {
        useMatterStore.getState().addMatter(matter);
      });

      // Create allocation with amount that doesn't cover all interest
      const request = {
        autodraftId: 'AUTODRAFT-001',
        method: 'waterfall',
        dateRange: {
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
      };

      useAllocationStore.getState().createAllocationRequest(request);

      await waitFor(() => {
        const preview = useAllocationStore.getState().allocationPreview;
        expect(preview?.carryForward).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe('Error Handling', () => {
    it('should display error when no autodraft selected', async () => {
      renderWithProviders();

      // Try to generate preview without selecting transaction
      const previewButton = screen.getByText(/Generate Preview/i);
      if (previewButton) {
        fireEvent.click(previewButton);

        await waitFor(() => {
          expect(screen.getByText(/No autodraft/i)).toBeInTheDocument();
        });
      }
    });

    it('should display error when no matters available', async () => {
      renderWithProviders();

      // Clear matters
      useMatterStore.getState().reset();

      // Try to generate preview
      const previewButton = screen.getByText(/Generate Preview/i);
      if (previewButton) {
        fireEvent.click(previewButton);

        await waitFor(() => {
          expect(screen.getByText(/No matters/i)).toBeInTheDocument();
        });
      }
    });

    it('should display error when autodraft amount is invalid', async () => {
      renderWithProviders();

      // Add invalid autodraft
      const autodraft = {
        id: 'AUTODRAFT-INVALID',
        date: new Date(),
        type: 'Autodraft',
        category: 'Interest',
        amount: -0, // Invalid amount
        netAmount: -0,
        status: 'Unassigned',
        description: 'Invalid Autodraft',
        createdAt: new Date(),
        allocations: [],
      };

      useTransactionStore.getState().addTransaction(autodraft);

      await waitFor(() => {
        const errorMessage = screen.queryByText(/Invalid amount/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  describe('Performance', () => {
    it('should handle large number of matters efficiently', async () => {
      const startTime = Date.now();

      // Add 100 test matters
      for (let i = 0; i < 100; i++) {
        const matter = {
          id: `MATTER-${String(i).padStart(3, '0')}`,
          caseNumber: `TEST-${String(i).padStart(3, '0')}`,
          clientName: `Client ${i}`,
          principalBalance: 100000 - (i * 1000),
          interestOwed: 5000 - (i * 50),
          interestRate: 8.5,
          createdAt: new Date(),
          lastActivity: new Date(),
          status: 'Active' as const,
          alerts: [],
        };

        useMatterStore.getState().addMatter(matter);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });

    it('should handle large number of allocations efficiently', async () => {
      const startTime = Date.now();

      // Add 50 test allocations
      for (let i = 0; i < 50; i++) {
        const allocation = {
          id: `ALLOC-${String(i).padStart(3, '0')}`,
          autodraftId: `AUTODRAFT-${String(i).padStart(3, '0')}`,
          autodraftDate: new Date(),
          totalAmount: 5000,
          allocations: [],
          carryForward: 0,
          executedAt: new Date(),
        };

        useAllocationStore.getState().allocations.push(allocation);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Should be fast
    });
  });
});
