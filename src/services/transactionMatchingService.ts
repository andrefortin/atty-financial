// ============================================
// Transaction Matching Service (QBO-Style)
// Enhanced with better error handling and reconciliation
// ============================================

import { BankTransaction, BankTransactionType } from './bankFeedService';

// ============================================
// Types
// ============================================

export interface Matter {
  id: string;
  clientName: string;
  principalBalance: number;
  status: 'Active' | 'Closed' | 'Archive';
}

export interface Payment {
  id: string;
  matterId: string;
  amount: number;
  date: Date;
  description: string;
  status: 'Pending' | 'Matched' | 'Unmatched';
}

export type MatchConfidence = 'high' | 'medium' | 'low';

export interface MatchSuggestion {
  bankTransactionId: string;
  matterId?: string;
  paymentId?: string;
  confidence: MatchConfidence;
  score: number;
  matchReason: string;
  suggestedAction: 'Auto-Match' | 'Manual-Review' | 'No-Match';
}

export interface MatchedTransaction {
  bankTransactionId: string;
  paymentId: string;
  matterId: string;
  matchConfidence: MatchConfidence;
  matchDate: Date;
  matchedBy: 'auto' | 'manual';
}

export interface MatchStatistics {
  totalBankTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  autoMatched: number;
  manualMatches: number;
  highConfidenceMatches: number;
  matchRate: number;
}

export interface AutoMatchRule {
  name: string;
  enabled: boolean;
  priority: number;
  matchFunction: (txn: BankTransaction, matters: Matter[], payments: Payment[]) => MatchSuggestion | null;
}

export interface MatchResult {
  success: boolean;
  matches: MatchedTransaction[];
  suggestions: MatchSuggestion[];
  errors: string[];
}

// ============================================
// Error Types
// ============================================

export class MatchingError extends Error {
  constructor(
    message: string,
    public code: string,
    public transactionId?: string
  ) {
    super(message);
    this.name = 'MatchingError';
  }
}

// ============================================
// In-Memory Storage
// ============================================

class MatchHistory {
  private matches: MatchedTransaction[] = [];
  private suggestions: Map<string, MatchSuggestion[]> = new Map();

  addMatch(match: MatchedTransaction): void {
    // Remove existing match if any
    this.matches = this.matches.filter(
      m => m.bankTransactionId !== match.bankTransactionId
    );
    this.matches.push(match);
  }

  addSuggestion(suggestion: MatchSuggestion): void {
    const key = suggestion.bankTransactionId;
    if (!this.suggestions.has(key)) {
      this.suggestions.set(key, []);
    }
    this.suggestions.get(key)!.push(suggestion);
  }

  getAll(): MatchedTransaction[] {
    return [...this.matches];
  }

  getSuggestions(bankTransactionId?: string): MatchSuggestion[] {
    if (bankTransactionId) {
      return this.suggestions.get(bankTransactionId) || [];
    }
    return Array.from(this.suggestions.values()).flat();
  }

  getMatch(bankTransactionId: string): MatchedTransaction | undefined {
    return this.matches.find(m => m.bankTransactionId === bankTransactionId);
  }

  clear(): void {
    this.matches = [];
    this.suggestions.clear();
  }

  removeMatch(bankTransactionId: string): boolean {
    const initialLength = this.matches.length;
    this.matches = this.matches.filter(m => m.bankTransactionId !== bankTransactionId);
    return this.matches.length < initialLength;
  }
}

const matchHistory = new MatchHistory();

// ============================================
// Auto-Match Rules
// ============================================

const autoMatchRules: AutoMatchRule[] = [
  {
    name: 'Exact Amount Match with Matter Reference',
    enabled: true,
    priority: 1,
    matchFunction: (txn, matters, payments) => {
      // Check if description contains matter ID pattern (e.g., JON-2024-001)
      const matterIdMatch = txn.description.match(/([A-Z]{3}-\d{4}-\d{3})/);
      if (!matterIdMatch) return null;

      const matterId = matterIdMatch[1];
      const matter = matters.find(m => m.id === matterId);

      if (!matter) return null;

      return {
        bankTransactionId: txn.id,
        matterId: matter.id,
        confidence: 'high',
        score: 95,
        matchReason: `Matter ID ${matterId} found in transaction description`,
        suggestedAction: 'Auto-Match',
      };
    },
  },
  {
    name: 'Exact Amount Match',
    enabled: true,
    priority: 2,
    matchFunction: (txn, matters, payments) => {
      // Look for payment with exact amount
      const matchingPayment = payments.find(
        p =>
          Math.abs(p.amount - Math.abs(txn.amount)) < 0.01 &&
          p.status === 'Unmatched' &&
          Math.abs(p.date.getTime() - txn.date.getTime()) < 86400000 * 3 // Within 3 days
      );

      if (!matchingPayment) return null;

      return {
        bankTransactionId: txn.id,
        paymentId: matchingPayment.id,
        matterId: matchingPayment.matterId,
        confidence: 'high',
        score: 90,
        matchReason: `Exact amount match with payment ${matchingPayment.id}`,
        suggestedAction: 'Auto-Match',
      };
    },
  },
  {
    name: 'Partial Amount Match',
    enabled: true,
    priority: 3,
    matchFunction: (txn, matters, payments) => {
      // Look for payment with partial amount (e.g., partial payment of larger amount)
      const matchingPayment = payments.find(
        p =>
          Math.abs(p.amount - Math.abs(txn.amount)) < Math.abs(p.amount) * 0.1 &&
          p.status === 'Unmatched' &&
          Math.abs(p.date.getTime() - txn.date.getTime()) < 86400000 * 7 // Within 7 days
      );

      if (!matchingPayment) return null;

      return {
        bankTransactionId: txn.id,
        paymentId: matchingPayment.id,
        matterId: matchingPayment.matterId,
        confidence: 'medium',
        score: 70,
        matchReason: `Partial amount match with payment ${matchingPayment.id}`,
        suggestedAction: 'Manual-Review',
      };
    },
  },
  {
    name: 'Similar Amount with Date Proximity',
    enabled: true,
    priority: 4,
    matchFunction: (txn, matters, payments) => {
      // Look for payment with similar amount and close date
      const matchingPayment = payments.find(
        p =>
          Math.abs(p.amount - Math.abs(txn.amount)) < Math.abs(p.amount) * 0.2 &&
          p.status === 'Unmatched' &&
          Math.abs(p.date.getTime() - txn.date.getTime()) < 86400000 * 5 // Within 5 days
      );

      if (!matchingPayment) return null;

      return {
        bankTransactionId: txn.id,
        paymentId: matchingPayment.id,
        matterId: matchingPayment.matterId,
        confidence: 'low',
        score: 50,
        matchReason: `Similar amount and date with payment ${matchingPayment.id}`,
        suggestedAction: 'Manual-Review',
      };
    },
  },
];

// ============================================
// Service Functions
// ============================================

/**
 * Get match confidence color for UI
 */
export function getMatchConfidenceColor(confidence: MatchConfidence): string {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  };
  return colors[confidence];
}

/**
 * Get match confidence label
 */
export function getMatchConfidenceLabel(confidence: MatchConfidence): string {
  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence',
  };
  return labels[confidence];
}

/**
 * Get match confidence icon
 */
export function getMatchConfidenceIcon(confidence: MatchConfidence): string {
  const icons = {
    high: '✓',
    medium: '~',
    low: '?',
  };
  return icons[confidence];
}

/**
 * Format transaction type for display
 */
export function formatTransactionType(type: BankTransactionType): string {
  return type.replace(/_/g, ' ');
}

/**
 * Get transaction status color
 */
export function getTransactionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    POSTED: 'bg-green-100 text-green-800',
    CLEARED: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get transaction status label
 */
export function getTransactionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    POSTED: 'Posted',
    CLEARED: 'Cleared',
    FAILED: 'Failed',
  };
  return labels[status] || status;
}

/**
 * Suggest matches for a bank transaction
 */
export function suggestMatches(
  bankTransaction: BankTransaction,
  matters: Matter[],
  payments: Payment[]
): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = [];

  try {
    // Run all enabled auto-match rules
    const enabledRules = autoMatchRules.filter(rule => rule.enabled).sort((a, b) => a.priority - b.priority);

    for (const rule of enabledRules) {
      try {
        const suggestion = rule.matchFunction(bankTransaction, matters, payments);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      } catch (error) {
        console.error(`Error in match rule "${rule.name}":`, error);
      }
    }

    // Store suggestions
    suggestions.forEach(s => matchHistory.addSuggestion(s));

    return suggestions;
  } catch (error) {
    console.error('Error generating match suggestions:', error);
    throw new MatchingError(
      'Failed to generate match suggestions',
      'SUGGESTION_ERROR',
      bankTransaction.id
    );
  }
}

/**
 * Apply a match to a transaction
 */
export function applyMatch(
  bankTransactionId: string,
  paymentId: string,
  matterId: string,
  matchedBy: 'auto' | 'manual' = 'manual'
): MatchedTransaction {
  try {
    // Get the suggestion to determine confidence
    const suggestions = matchHistory.getSuggestions(bankTransactionId);
    const suggestion = suggestions.find(s => s.paymentId === paymentId);

    if (!suggestion) {
      throw new MatchingError(
        'No matching suggestion found',
        'NO_SUGGESTION',
        bankTransactionId
      );
    }

    const match: MatchedTransaction = {
      bankTransactionId,
      paymentId,
      matterId,
      matchConfidence: suggestion.confidence,
      matchDate: new Date(),
      matchedBy,
    };

    matchHistory.addMatch(match);
    return match;
  } catch (error) {
    console.error('Error applying match:', error);
    throw error instanceof MatchingError ? error : new MatchingError(
      'Failed to apply match',
      'MATCH_ERROR',
      bankTransactionId
    );
  }
}

/**
 * Unmatch a transaction
 */
export function unmatchTransaction(bankTransactionId: string): boolean {
  return matchHistory.removeMatch(bankTransactionId);
}

/**
 * Run auto-match for multiple transactions
 */
export function runAutoMatch(
  bankTransactions: BankTransaction[],
  matters: Matter[],
  payments: Payment[]
): MatchResult {
  const matches: MatchedTransaction[] = [];
  const suggestions: MatchSuggestion[] = [];
  const errors: string[] = [];

  try {
    for (const txn of bankTransactions) {
      // Skip if already matched
      if (matchHistory.getMatch(txn.id)) {
        continue;
      }

      try {
        const txnSuggestions = suggestMatches(txn, matters, payments);

        // Auto-apply high confidence matches
        const highConfidenceMatch = txnSuggestions.find(
          s => s.confidence === 'high' && s.suggestedAction === 'Auto-Match'
        );

        if (highConfidenceMatch && highConfidenceMatch.paymentId) {
          const match = applyMatch(
            txn.id,
            highConfidenceMatch.paymentId,
            highConfidenceMatch.matterId!,
            'auto'
          );
          matches.push(match);
        } else {
          suggestions.push(...txnSuggestions);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${txn.id}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      matches,
      suggestions,
      errors,
    };
  } catch (error) {
    console.error('Error running auto-match:', error);
    return {
      success: false,
      matches,
      suggestions,
      errors: [`Auto-match failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Get match statistics
 */
export function getMatchStatistics(
  bankTransactions: BankTransaction[]
): MatchStatistics {
  const matches = matchHistory.getAll();
  const matchedTransactionIds = new Set(matches.map(m => m.bankTransactionId));

  return {
    totalBankTransactions: bankTransactions.length,
    matchedTransactions: matchedTransactionIds.size,
    unmatchedTransactions: bankTransactions.length - matchedTransactionIds.size,
    autoMatched: matches.filter(m => m.matchedBy === 'auto').length,
    manualMatches: matches.filter(m => m.matchedBy === 'manual').length,
    highConfidenceMatches: matches.filter(m => m.matchConfidence === 'high').length,
    matchRate: bankTransactions.length > 0
      ? (matchedTransactionIds.size / bankTransactions.length) * 100
      : 0,
  };
}

/**
 * Export match report as JSON
 */
export function exportMatchReport(): string {
  const matches = matchHistory.getAll();
  const suggestions = matchHistory.getSuggestions();

  return JSON.stringify({
    matches,
    suggestions,
    statistics: {
      totalMatches: matches.length,
      autoMatched: matches.filter(m => m.matchedBy === 'auto').length,
      manualMatches: matches.filter(m => m.matchedBy === 'manual').length,
    },
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

/**
 * Get all matches
 */
export function getAllMatches(): MatchedTransaction[] {
  return matchHistory.getAll();
}

/**
 * Get all suggestions
 */
export function getAllSuggestions(): MatchSuggestion[] {
  return matchHistory.getSuggestions();
}

/**
 * Get match for a specific transaction
 */
export function getTransactionMatch(bankTransactionId: string): MatchedTransaction | undefined {
  return matchHistory.getMatch(bankTransactionId);
}

/**
 * Clear all match history (for testing)
 */
export function clearMatchHistory(): void {
  matchHistory.clear();
}
