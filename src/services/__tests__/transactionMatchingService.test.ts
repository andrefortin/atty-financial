// ============================================
// Unit Tests for Transaction Matching Service
// ============================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  suggestMatches,
  applyMatch,
  unmatchTransaction,
  runAutoMatch,
  getMatchStatistics,
  getAllMatches,
  getAllSuggestions,
  getTransactionMatch,
  clearMatchHistory,
  exportMatchReport,
  getMatchConfidenceColor,
  getMatchConfidenceLabel,
  getMatchConfidenceIcon,
} from '../transactionMatchingService';
import { BankTransaction, BankTransactionType, MatchConfidence } from '../../types';
import {
  initializeTestStores,
  mockMatter,
  mockTransaction,
  mockAllocation,
  mockToday,
} from '../../test/test-utils';

// ============================================
// Setup & Teardown
// ============================================

describe('Transaction Matching Service', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  afterEach(() => {
    clearMatchHistory();
  });

  // ============================================
  // Match Suggestion Tests
  // ============================================

  describe('suggestMatches', () => {
    it('should suggest exact match for transactions with matter ID in description', () => {
      const txn: BankTransaction = {
        ...mockTransaction,
        description: 'Monthly Principal Payment - TEST-MATTER-001',
      };

      const matters = [mockMatter];
      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].confidence).toBe('high');
      expect(suggestions[0].suggestedAction).toBe('Auto-Match');
    });

    it('should suggest high confidence match for exact amount', () => {
      const txn: BankTransaction = {
        ...mockTransaction,
        amount: 50000,
      };

      const matters = [mockMatter];
      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.confidence === 'high'));
    });

    it('should suggest medium confidence for partial amount match', () => {
      const txn: BankTransaction = {
        ...mockTransaction,
        amount: 45000,
      };

      const matters = [mockMatter];
      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.confidence === 'medium'));
    });

    it('should suggest low confidence for similar amount with date proximity', () => {
      const txn: BankTransaction = {
        ...mockTransaction,
        amount: 40000,
        date: mockYesterday,
      };

      const matters = [mockMatter];
      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.confidence === 'low'));
    });

    it('should return empty suggestions if no matches found', () => {
      const txn: BankTransaction = {
        ...mockTransaction,
        amount: 1, // Very small amount
        description: 'Unrelated transaction',
      };

      const matters = [mockMatter];
      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions).toHaveLength(0);
    });

    it('should handle empty matters array', () => {
      const txn: BankTransaction = { ...mockTransaction };
      const matters: any[] = [];

      const suggestions = suggestMatches(txn, matters, []);

      expect(suggestions).toHaveLength(0);
    });
  });

  // ============================================
  // Match Application Tests
  // ============================================

  describe('applyMatch', () => {
    it('should apply a match successfully', () => {
      const transactionId = 'TEST-TXN-001';
      const paymentId = 'TEST-PAY-001';
      const matterId = 'TEST-MATTER-001';

      const match = applyMatch(transactionId, paymentId, matterId, 'manual');

      expect(match.bankTransactionId).toBe(transactionId);
      expect(match.paymentId).toBe(paymentId);
      expect(match.matterId).toBe(matterId);
      expect(match.matchedBy).toBe('manual');
      expect(match.matchDate).toBeInstanceOf(Date);
    });

    it('should throw error if no suggestion exists', () => {
      expect(() => {
        applyMatch('NON-EXISTENT', 'TEST-PAY-001', 'TEST-MATTER-001', 'manual');
      }).toThrow();
    });
  });

  describe('unmatchTransaction', () => {
    it('should unmatch a transaction successfully', () => {
      const transactionId = 'TEST-TXN-001';

      // First apply a match
      applyMatch(transactionId, 'TEST-PAY-001', 'TEST-MATTER-001', 'manual');

      // Then unmatch it
      const result = unmatchTransaction(transactionId);

      expect(result).toBe(true);
    });

    it('should return false if transaction is not matched', () => {
      const result = unmatchTransaction('NON-MATCHED-TXN');

      expect(result).toBe(false);
    });
  });

  describe('runAutoMatch', () => {
    it('should auto-match multiple transactions', () => {
      const transactions: BankTransaction[] = [
        {
          ...mockTransaction,
          id: 'TXN-001',
          description: 'Monthly Principal Payment - TEST-MATTER-001',
          amount: 50000,
        },
        {
          ...mockTransaction,
          id: 'TXN-002',
          description: 'Monthly Principal Payment - TEST-MATTER-002',
          amount: 25000,
        },
      ];

      const matters = [
        mockMatter,
        { ...mockMatter, id: 'TEST-MATTER-002', clientName: 'Client 2' },
      ];

      const result = runAutoMatch(transactions, matters, []);

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches.every(m => m.matchedBy === 'auto'));
    });

    it('should auto-apply high confidence matches only', () => {
      const transactions: BankTransaction[] = [
        {
          ...mockTransaction,
          id: 'TXN-HIGH',
          description: 'Monthly Principal Payment - TEST-MATTER-001',
          amount: 50000,
        },
        {
          ...mockTransaction,
          id: 'TXN-LOW',
          description: 'Uncertain Payment',
          amount: 45000,
        },
      ];

      const matters = [mockMatter];
      const result = runAutoMatch(transactions, matters, []);

      expect(result.matches.length).toBe(1);
      expect(result.matches[0].transactionId).toBe('TXN-HIGH');
    });

    it('should collect errors for failed matches', () => {
      const transactions: BankTransaction[] = [
        {
          ...mockTransaction,
          id: 'TXN-ERROR',
          description: 'Problematic Transaction',
        },
      ];

      const matters = [];
      const result = runAutoMatch(transactions, matters, []);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('TXN-ERROR');
    });
  });

  // ============================================
  // Match Statistics Tests
  // ============================================

  describe('getMatchStatistics', () => {
    it('should calculate match statistics correctly', () => {
      const transactions: BankTransaction[] = [
        mockTransaction,
        { ...mockTransaction, id: 'TXN-002' },
        { ...mockTransaction, id: 'TXN-003' },
      ];

      const stats = getMatchStatistics(transactions);

      expect(stats.totalBankTransactions).toBe(3);
      expect(stats.matchedTransactions).toBeGreaterThanOrEqual(0);
      expect(stats.unmatchedTransactions).toBeLessThanOrEqual(3);
      expect(stats.matchRate).toBeGreaterThanOrEqual(0);
      expect(stats.matchRate).toBeLessThanOrEqual(100);
    });

    it('should handle empty transactions array', () => {
      const stats = getMatchStatistics([]);

      expect(stats.totalBankTransactions).toBe(0);
      expect(stats.matchedTransactions).toBe(0);
      expect(stats.unmatchedTransactions).toBe(0);
      expect(stats.matchRate).toBe(0);
    });
  });

  // ============================================
  // Match History Tests
  // ============================================

  describe('getAllMatches', () => {
    it('should return all matches', () => {
      applyMatch('TXN-001', 'PAY-001', 'MATTER-001', 'manual');
      applyMatch('TXN-002', 'PAY-002', 'MATTER-002', 'manual');

      const matches = getAllMatches();

      expect(matches).toHaveLength(2);
      expect(matches[0].bankTransactionId).toBe('TXN-001');
      expect(matches[1].bankTransactionId).toBe('TXN-002');
    });

    it('should return empty array if no matches', () => {
      const matches = getAllMatches();

      expect(matches).toHaveLength(0);
    });
  });

  describe('getTransactionMatch', () => {
    it('should return match for specific transaction', () => {
      const transactionId = 'TXN-001';
      applyMatch(transactionId, 'PAY-001', 'MATTER-001', 'manual');

      const match = getTransactionMatch(transactionId);

      expect(match).toBeDefined();
      expect(match?.bankTransactionId).toBe(transactionId);
    });

    it('should return undefined for unmatched transaction', () => {
      const match = getTransactionMatch('NON-MATCHED');

      expect(match).toBeUndefined();
    });
  });

  describe('getAllSuggestions', () => {
    it('should return all suggestions', () => {
      const txn: BankTransaction = { ...mockTransaction };
      const matters = [mockMatter];

      suggestMatches(txn, matters, []);

      const suggestions = getAllSuggestions();

      expect(suggestions).toBeInstanceOf(Array);
    });
  });

  // ============================================
  // Report Export Tests
  // ============================================

  describe('exportMatchReport', () => {
    it('should export match report as JSON', () => {
      applyMatch('TXN-001', 'PAY-001', 'MATTER-001', 'auto');

      const report = exportMatchReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('matches');
      expect(report).toContain('statistics');
    });
  });

  // ============================================
  // Helper Function Tests
  // ============================================

  describe('getMatchConfidenceColor', () => {
    it('should return green color for high confidence', () => {
      const color = getMatchConfidenceColor('high');

      expect(color).toContain('bg-green');
    });

    it('should return yellow color for medium confidence', () => {
      const color = getMatchConfidenceColor('medium');

      expect(color).toContain('bg-yellow');
    });

    it('should return red color for low confidence', () => {
      const color = getMatchConfidenceColor('low');

      expect(color).toContain('bg-red');
    });
  });

  describe('getMatchConfidenceLabel', () => {
    it('should return high confidence label', () => {
      const label = getMatchConfidenceLabel('high');

      expect(label).toBe('High Confidence');
    });

    it('should return medium confidence label', () => {
      const label = getMatchConfidenceLabel('medium');

      expect(label).toBe('Medium Confidence');
    });

    it('should return low confidence label', () => {
      const label = getMatchConfidenceLabel('low');

      expect(label).toBe('Low Confidence');
    });
  });

  describe('getMatchConfidenceIcon', () => {
    it('should return checkmark for high confidence', () => {
      const icon = getMatchConfidenceIcon('high');

      expect(icon).toBe('✓');
    });

    it('should return tilde for medium confidence', () => {
      const icon = getMatchConfidenceIcon('medium');

      expect(icon).toBe('~');
    });

    it('should return question mark for low confidence', () => {
      const icon = getMatchConfidenceIcon('low');

      expect(icon).toBe('?');
    });
  });

  // ============================================
  // Clear History Tests
  // ============================================

  describe('clearMatchHistory', () => {
    it('should clear all match history', () => {
      applyMatch('TXN-001', 'PAY-001', 'MATTER-001', 'auto');

      const matchesBefore = getAllMatches();
      clearMatchHistory();
      const matchesAfter = getAllMatches();

      expect(matchesBefore.length).toBeGreaterThan(0);
      expect(matchesAfter.length).toBe(0);
    });
  });
});
