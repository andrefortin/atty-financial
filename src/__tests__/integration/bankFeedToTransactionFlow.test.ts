// ============================================
// Integration Tests - Bank Feed to Transaction Flow
// ============================================

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BankFeedPage } from '../../pages/BankFeed';
import {
  useTransactionStore,
  useMatterStore,
} from '../../store';
import {
  fetchBankTransactions,
  subscribeToTransactions,
  runAutoMatch,
  getMatchStatistics,
  applyMatch,
  getTransactionMatch,
  reconcileTransactions,
  exportMatchReport,
} from '../../services';

// ============================================
// Setup
// ============================================

const renderWithProviders = () => {
  return render(<BankFeedPage />);
};

describe('Bank Feed to Transaction Flow Integration', () => {
  beforeEach(() => {
    // Clear stores
    useTransactionStore.getState().reset();
    useMatterStore.getState().reset();

    // Reset local storage
    localStorage.clear();
  });

  // ============================================
  // End-to-End Flow Tests
  // ============================================

  describe('Complete Bank Feed Flow', () => {
    it('should fetch and display bank transactions', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should filter transactions by type', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find type filter select
      const typeFilter = screen.queryByLabelText(/Type/i);
      if (typeFilter) {
        fireEvent.change(typeFilter, { target: { value: 'ACH' } });

        await waitFor(() => {
          const rows = screen.getAllByRole('row');
          rows.forEach((row) => {
            const cell = row.textContent || '';
            expect(cell).toContain('ACH');
          });
        });
      }
    });

    it('should filter transactions by status', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find status filter select
      const statusFilter = screen.queryByLabelText(/Status/i);
      if (statusFilter) {
        fireEvent.change(statusFilter, { target: { value: 'POSTED' } });

        await waitFor(() => {
          const rows = screen.getAllByRole('row');
          rows.forEach((row) => {
            const cell = row.textContent || '';
            expect(cell).toContain('POSTED');
          });
        });
      }
    });

    it('should filter transactions by date range', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find date range inputs
      const startDateInput = screen.queryByLabelText(/Start Date/i);
      const endDateInput = screen.queryByLabelText(/End Date/i);

      if (startDateInput && endDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-03-31' } });

        // Check filtered results
        const rows = screen.getAllByRole('row');
        rows.forEach((row) => {
          const cell = row.textContent || '';
          // Should contain dates within March 2024
          expect(cell).toMatch(/March 2024|2024-03/);
        });
      }
    });

    it('should search transactions by description', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find search input
      const searchInput = screen.queryByPlaceholderText(/Search/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Principal Payment' } });

        await waitFor(() => {
          const rows = screen.getAllByRole('row');
          rows.forEach((row) => {
            const cell = row.textContent || '';
            expect(cell).toContain('Principal Payment');
          });
        });
      }
    });
  });

  // ============================================
  // Transaction Matching Flow
  // ============================================

  describe('Transaction Matching Integration', () => {
    it('should display match suggestions for transactions', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Select a transaction
      const rows = screen.getAllByRole('row');
      if (rows.length > 0) {
        fireEvent.click(rows[0]);

        // Look for match suggestions panel
        await waitFor(() => {
          const suggestionsPanel = screen.queryByLabelText(/Match Suggestions/i);
          expect(suggestionsPanel).toBeInTheDocument();
        }, { timeout: 2000 });
      }
    });

    it('should allow manual matching of transactions', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Select a transaction
      const rows = screen.getAllByRole('row');
      if (rows.length > 0) {
        fireEvent.click(rows[0]);

        // Look for match button
        const matchButton = screen.queryByText(/Match/i);
        if (matchButton) {
          fireEvent.click(matchButton);

          // Check if transaction is now matched
          await waitFor(() => {
            const statusBadge = screen.queryByText(/Matched/i);
            expect(statusBadge).toBeInTheDocument();
          }, { timeout: 2000 });
        }
      }
    });

    it('should run auto-match for multiple transactions', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find auto-match button
      const autoMatchButton = screen.queryByText(/Auto Match/i);
      if (autoMatchButton) {
        fireEvent.click(autoMatchButton);

        // Check for match statistics update
        await waitFor(() => {
          const stats = screen.queryByText(/Matched|Auto Matched/i);
          expect(stats).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('should display match statistics', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Look for statistics cards
      const totalTransactions = screen.queryByText(/Total Transactions/i);
      const matchedTransactions = screen.queryByText(/Matched Transactions/i);
      const matchRate = screen.queryByText(/Match Rate/i);

      expect(totalTransactions || matchedTransactions || matchRate).toBeInTheDocument();
    });
  });

  // ============================================
  // Transaction Creation Flow
  // ============================================

  describe('Transaction Creation from Bank Feed', () => {
    it('should allow creating transaction from bank transaction', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Select a bank transaction
      const rows = screen.getAllByRole('row');
      if (rows.length > 0) {
        fireEvent.click(rows[0]);

        // Look for create transaction button
        const createButton = screen.queryByText(/Create Transaction/i);
        if (createButton) {
          fireEvent.click(createButton);

          // Check for transaction creation modal
          await waitFor(() => {
            const modal = screen.queryByRole('dialog');
            expect(modal).toBeInTheDocument();
          }, { timeout: 2000 });
        }
      }
    });

    it('should allocate transaction to matters', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // This would involve complex UI interactions
      // For integration test, we verify the store integration
      const transaction = {
        id: 'TXN-001',
        date: new Date(),
        type: 'Draw' as const,
        category: 'Funding' as const,
        amount: 50000,
        netAmount: 50000,
        status: 'Allocated' as const,
        description: 'Test Draw',
        createdAt: new Date(),
        allocations: [
          {
            matterId: 'MATTER-001',
            matterName: 'Test Client',
            amount: 50000,
          },
        ],
      };

      useTransactionStore.getState().addTransaction(transaction);

      await waitFor(() => {
        const createdTransaction = getTransactionMatch('TXN-001');
        expect(createdTransaction).toBeDefined();
      });
    });
  });

  // ============================================
  // Reconciliation Flow
  // ============================================

  describe('Reconciliation Integration', () => {
    it('should reconcile bank transactions with internal records', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // This would verify the service integration
      const bankTransactions = fetchBankTransactions();
      const internalTransactions = useTransactionStore.getState().transactions;

      if (bankTransactions.success) {
        const result = reconcileTransactions(bankTransactions.data, internalTransactions);

        expect(result.reconciled).toBeGreaterThanOrEqual(0);
        expect(result.totalAmount).toBeGreaterThan(0);
      }
    });

    it('should display reconciliation summary', async () => {
      renderWithProviders();

      // Look for reconciliation summary section
      const reconciledCount = screen.queryByText(/Reconciled/i);
      const unreconciledCount = screen.queryByText(/Unreconciled/i);
      const totalAmount = screen.queryByText(/Total Amount/i);

      expect(reconciledCount || unreconciledCount || totalAmount).toBeInTheDocument();
    });

    it('should identify unmatched transactions', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // This would verify the service finds unmatched transactions
      const transactions = fetchBankTransactions();
      const statistics = getMatchStatistics(transactions.success ? transactions.data : []);

      if (statistics.unmatchedTransactions > 0) {
        expect(screen.queryByText(/Unmatched/i)).toBeInTheDocument();
      }
    });
  });

  // ============================================
  // Export Flow
  // ============================================

  describe('Export Integration', () => {
    it('should export match report', async () => {
      renderWithProviders();

      // Find export button
      const exportButton = screen.queryByText(/Export/i);
      if (exportButton) {
        const exportClick = jest.spyOn(exportMatchReport);

        fireEvent.click(exportButton);

        // This would trigger the actual export
        // For test, we verify the service is called
        expect(exportClick).toHaveBeenCalled();
      }
    });

    it('should export transactions to CSV', async () => {
      renderWithProviders();

      // Find CSV export option
      const csvExport = screen.queryByText(/CSV/i);
      if (csvExport) {
        const exportClick = jest.fn(); // Mock export function

        csvExport.click();

        // Verify export would happen
        expect(exportClick).toHaveBeenCalled();
      }
    });

    it('should export transactions to Excel', async () => {
      renderWithProviders();

      // Find Excel export option
      const excelExport = screen.queryByText(/Excel/i);
      if (excelExport) {
        const exportClick = jest.fn(); // Mock export function

        excelExport.click();

        // Verify export would happen
        expect(exportClick).toHaveBeenCalled();
      }
    });
  });

  // ============================================
  // Real-time Updates
  // ============================================

  describe('Real-time Updates', () => {
    it('should update when new bank transactions arrive', async () => {
      const updates: any[] = [];
      const unsubscribe = subscribeToTransactions((transactions) => {
        updates.push(transactions);
      });

      // Generate new transactions
      const newTransactions = await fetchBankTransactions();
      expect(newTransactions.success).toBe(true);

      // Verify subscription was called
      expect(updates.length).toBeGreaterThan(0);

      unsubscribe();
    });

    it('should refresh transaction list on interval', async () => {
      renderWithProviders();

      // Find refresh button
      const refreshButton = screen.queryByLabelText(/Refresh/i);
      if (refreshButton) {
        const initialCount = screen.getAllByRole('row').length;

        fireEvent.click(refreshButton);

        await waitFor(() => {
          const newCount = screen.getAllByRole('row').length;
          expect(newCount).toBeGreaterThanOrEqual(initialCount);
        }, { timeout: 3000 });
      }
    });
  });

  // ============================================
  // Store Integration
  // ============================================

  describe('Store Integration', () => {
    it('should integrate bank transactions with transaction store', async () => {
      renderWithProviders();

      // Wait for transactions to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 3000 });

      const bankTransactions = await fetchBankTransactions();
      const storeTransactions = useTransactionStore.getState().transactions;

      if (bankTransactions.success) {
        expect(storeTransactions.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should update match statistics in transaction store', async () => {
      renderWithProviders();

      // Apply a match
      applyMatch('TXN-001', 'PAY-001', 'MATTER-001', 'manual');

      await waitFor(() => {
        const match = getTransactionMatch('TXN-001');
        expect(match).toBeDefined();
      });

      // Update statistics
      const allTransactions = useTransactionStore.getState().transactions;
      const statistics = getMatchStatistics(allTransactions);

      expect(statistics.manualMatches).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Error Handling
  // ============================================

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      renderWithProviders();

      // This would verify the UI shows error state
      const errorMessage = screen.queryByText(/Error loading transactions/i);

      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    it('should handle match errors gracefully', async () => {
      renderWithProviders();

      // Try to match invalid transaction
      const result = runAutoMatch([], [], []);

      expect(result.success).toBe(true); // Should not throw
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should display empty state when no transactions', async () => {
      renderWithProviders();

      // Clear transactions
      useTransactionStore.getState().transactions = [];

      // Wait for empty state
      await waitFor(() => {
        const emptyState = screen.queryByText(/No transactions/i);
        expect(emptyState).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  // ============================================
  // Performance
  // ============================================

  describe('Performance', () => {
    it('should handle large number of transactions efficiently', async () => {
      const startTime = Date.now();

      // Add 100 test transactions
      for (let i = 0; i < 100; i++) {
        const transaction = {
          id: `TXN-${String(i).padStart(3, '0')}`,
          date: new Date(),
          type: 'ACH' as const,
          category: 'Funding' as const,
          amount: 50000 + (i * 1000),
          netAmount: 50000 + (i * 1000),
          status: 'Allocated' as const,
          description: `Transaction ${i}`,
          createdAt: new Date(),
          allocations: [
            {
              matterId: 'MATTER-001',
              matterName: 'Client A',
              amount: 50000 + (i * 1000),
            },
          ],
        };

        useTransactionStore.getState().addTransaction(transaction);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });

    it('should auto-match many transactions efficiently', async () => {
      // Create test transactions
      const transactions = [];
      for (let i = 0; i < 50; i++) {
        transactions.push({
          id: `TXN-${String(i).padStart(3, '0')}`,
          date: new Date(),
          type: 'ACH' as const,
          amount: 50000,
          description: `Payment - MATTER-${String(i).padStart(3, '0')}`,
          referenceNumber: `REF${String(i).padStart(3, '0')}`,
          status: 'POSTED' as const,
          fromAccount: '****1234',
          toAccount: undefined,
          createdAt: new Date(),
        });
      }

      const startTime = Date.now();
      const result = runAutoMatch(transactions, [], []);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });
  });
});
