/**
 * BankJoy Matching Service
 *
 * Match BankJoy transactions to our matters.
 * Supports auto-match by reference number and fuzzy matching by amount and date.
 *
 * @module services/bankjoy/matching.service
 */

// ============================================
// Types
// ============================================

/**
 * Match result
 */
export interface MatchResult {
  /**
   * Match status
   */
  status: 'matched' | 'unmatched' | 'multiple_matches';

  /**
   * Matched matter ID (if matched)
   */
  matterId?: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Match reason
   */
  reason?: string;
}

/**
 * Transaction match suggestion
 */
export interface TransactionMatchSuggestion {
  /**
   * BankJoy transaction ID
   */
  bankJoyTransactionId: string;

  /**
   * Reference number
   */
  referenceNumber: string;

  /**
   * Transaction amount
   */
  amount: number;

  /**
   * Transaction date
   */
  transactionDate: string;

  /**
   * Matched matter ID
   */
  matterId?: string;

  /**
   * Matter number
   */
  matterNumber?: string;

  /**
   * Client name
   */
  clientName?: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Match type
   */
  matchType: 'reference_number' | 'amount_date' | 'fuzzy';

  /**
   * Match reason
   */
  reason?: string;
}

/**
 * Fuzzy match criteria
 */
export interface FuzzyMatchCriteria {
  /**
   * Amount tolerance (+/-)
   * @default 0.01 (1%)
   */
  amountTolerance?: number;

  /**
   * Date tolerance in days
   * @default 3 days
   */
  dateTolerance?: number;

  /**
   * Description similarity threshold (0-1)
   * @default 0.5
   */
  descriptionSimilarityThreshold?: number;

  /**
   * Counterparty similarity threshold (0-1)
   * @default 0.7
   */
  counterpartySimilarityThreshold?: number;
}

/**
 * Manual match request
 */
export interface ManualMatchRequest {
  /**
   * BankJoy transaction ID
   */
  bankJoyTransactionId: string;

  /**
   * Matter ID to match to
   */
  matterId: string;

  /**
   * Force match (even if low confidence)
   * @default false
   */
  forceMatch?: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_FUZZY_MATCH: FuzzyMatchCriteria = {
  amountTolerance: 0.01, // 1%
  dateTolerance: 3, // 3 days
  descriptionSimilarityThreshold: 0.5,
  counterpartySimilarityThreshold: 0.7,
};

const REFERENCE_NUMBER_REGEX = /^(\d{4}-\d{4}-\d{5})$/;
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.7,
  FAIR: 0.5,
  POOR: 0.3,
};

// ============================================
// BankJoy Matching Service
// ============================================

/**
 * BankJoy Matching Service
 *
 * Matches BankJoy transactions to our matters.
 * Supports auto-match by reference number and fuzzy matching by amount and date.
 */
export class BankJoyMatchingService {
  /**
   * Match transactions by reference number
   *
   * @param bankJoyTransactions - BankJoy transactions to match
   * @param matters - Matters to match against
   * @returns Map of bankJoy transaction ID to match result
   */
  matchByReferenceNumber(
    bankJoyTransactions: Array<{
      id: string;
      referenceNumber: string;
      amount: number;
      transactionDate: string;
    }>,
    matters: Array<{
      id: string;
      matterId: string;
      clientName: string;
      principalBalance: number;
    }>
  ): Map<string, MatchResult> {
    const matches = new Map<string, MatchResult>();

    bankJoyTransactions.forEach((bankJoyTransaction) => {
      // Check if reference number exists
      if (!bankJoyTransaction.referenceNumber) {
        matches.set(bankJoyTransaction.id, {
          status: 'unmatched',
          confidence: 0,
          reason: 'No reference number',
        });
        return;
      }

      // Find matching matters
      const matchingMatters = matters.filter((matter) =>
        matter.matterId === bankJoyTransaction.referenceNumber
      );

      if (matchingMatters.length === 0) {
        matches.set(bankJoyTransaction.id, {
          status: 'unmatched',
          confidence: 0,
          reason: 'No matter with matching reference number',
        });
        return;
      }

      if (matchingMatters.length > 1) {
        // Multiple matches
        matches.set(bankJoyTransaction.id, {
          status: 'multiple_matches',
          matterId: matchingMatters[0].id,
          confidence: 0,
          reason: `Multiple matters with reference number: ${bankJoyTransaction.referenceNumber}`,
        });
        return;
      }

      // Single match
      matches.set(bankJoyTransaction.id, {
        status: 'matched',
        matterId: matchingMatters[0].id,
        confidence: 1,
        reason: 'Matched by reference number',
      });
    });

    return matches;
  }

  /**
   * Match transactions by amount and date (fuzzy)
   *
   * @param bankJoyTransactions - BankJoy transactions to match
   * @param matters - Matters to match against
   * @param criteria - Fuzzy match criteria
   * @returns Map of bankJoy transaction ID to match result
   */
  matchByAmountAndDate(
    bankJoyTransactions: Array<{
      id: string;
      amount: number;
      transactionDate: string;
      referenceNumber: string;
      counterparty: string;
      description: string;
    }>,
    matters: Array<{
      id: string;
      matterId: string;
      clientName: string;
      principalBalance: number;
    }>,
    criteria: FuzzyMatchCriteria = DEFAULT_FUZZY_MATCH
  ): Map<string, MatchResult> {
    const matches = new Map<string, MatchResult>();

    bankJoyTransactions.forEach((bankJoyTransaction) => {
      let bestMatch: {
        matterId: '',
        confidence: 0,
        matchType: 'amount_date' as 'amount_date',
      };

      matters.forEach((matter) => {
        // Check amount match
        const amountDifference = Math.abs(bankJoyTransaction.amount - matter.principalBalance);
        const amountMatch = amountDifference <= (matter.principalBalance * criteria.amountTolerance);

        if (!amountMatch) {
          return;
        }

        // Check date match
        const transactionDate = new Date(bankJoyTransaction.transactionDate);
        const matterDate = new Date(); // Use current date or matter creation date
        const dateDifference = Math.abs(transactionDate.getTime() - matterDate.getTime()) / (1000 * 60 * 60 * 24);
        const dateMatch = dateDifference <= criteria.dateTolerance;

        if (!dateMatch) {
          return;
        }

        // Calculate confidence
        const confidence = this.calculateFuzzyMatchConfidence(
          bankJoyTransaction,
          matter,
          criteria
        );

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            matterId: matter.id,
            confidence,
            matchType: 'amount_date',
          };
        }
      });

      if (bestMatch.confidence < CONFIDENCE_THRESHOLDS.FAIR) {
        matches.set(bankJoyTransaction.id, {
          status: 'unmatched',
          confidence: bestMatch.confidence,
          reason: 'No fuzzy match meets confidence threshold',
        });
        return;
      }

      matches.set(bankJoyTransaction.id, {
        status: 'matched',
        matterId: bestMatch.matterId,
        confidence: bestMatch.confidence,
        reason: `Matched by amount and date (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`,
      });
    });

    return matches;
  }

  /**
   * Calculate fuzzy match confidence
   *
   * @param bankJoyTransaction - BankJoy transaction
   * @param matter - Matter to match
   * @param criteria - Fuzzy match criteria
   * @returns Confidence score (0-1)
   */
  private calculateFuzzyMatchConfidence(
    bankJoyTransaction: {
      id: string;
      amount: number;
      transactionDate: string;
      counterparty: string;
      description: string;
      referenceNumber: string;
    },
    matter: {
      id: string;
      matterId: string;
      clientName: string;
      principalBalance: number;
    },
    criteria: FuzzyMatchCriteria
  ): number {
    let confidence = 0;

    // Amount match confidence
    const amountDifference = Math.abs(bankJoyTransaction.amount - matter.principalBalance);
    const amountRatio = amountDifference / matter.principalBalance;
    const amountConfidence = 1 - Math.min(amountRatio, 1);
    confidence += amountConfidence * 0.4; // 40% weight

    // Date match confidence
    const transactionDate = new Date(bankJoyTransaction.transactionDate);
    const matterDate = new Date(); // Use current date or matter creation date
    const dateDifference = Math.abs(transactionDate.getTime() - matterDate.getTime()) / (1000 * 60 * 60 * 24);
    const dateRatio = dateDifference / criteria.dateTolerance;
    const dateConfidence = 1 - Math.min(dateRatio, 1);
    confidence += dateConfidence * 0.3; // 30% weight

    // Counterparty match confidence
    const counterpartySimilarity = this.calculateSimilarity(
      bankJoyTransaction.counterparty.toLowerCase(),
      matter.clientName.toLowerCase()
    );
    confidence += counterpartySimilarity * criteria.counterpartySimilarityThreshold * 0.2; // 20% weight

    // Description match confidence
    const descriptionSimilarity = this.calculateSimilarity(
      bankJoyTransaction.description?.toLowerCase() || '',
      matter.matterId.toLowerCase()
    );
    confidence += descriptionSimilarity * criteria.descriptionSimilarityThreshold * 0.1; // 10% weight

    // Reference number bonus
    const referenceNumberMatch = bankJoyTransaction.referenceNumber === matter.matterId;
    if (referenceNumberMatch) {
      confidence += 0.05; // 5% bonus
    }

    return Math.min(confidence, 1);
  }

  /**
   * Calculate similarity between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) {
      return 0;
    }

    // Exact match
    if (str1 === str2) {
      return 1;
    }

    // Check for substring match
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.8;
    }

    // Check for partial match (one string starts with the other)
    if (str1.startsWith(str2) || str2.startsWith(str1)) {
      return 0.5;
    }

    // Check for word overlap
    const words1 = str1.split(/\s+/).filter((w) => w.length > 2);
    const words2 = str2.split(/\s+/).filter((w) => w.length > 2);
    const commonWords = words1.filter((w) => words2.includes(w));

    if (commonWords.length > 0) {
      return 0.3 + (commonWords.length / Math.max(words1.length, words2.length)) * 0.5;
    }

    // No match
    return 0;
  }

  /**
   * Generate match suggestions for unassigned transactions
   *
   * @param bankJoyTransactions - BankJoy transactions
   * @param matters - Matters to match against
   * @param criteria - Fuzzy match criteria
   * @returns Array of match suggestions
   */
  generateMatchSuggestions(
    bankJoyTransactions: Array<{
      id: string;
      referenceNumber: string;
      amount: number;
      transactionDate: string;
      counterparty: string;
      description: string;
    }>,
    matters: Array<{
      id: string;
      matterId: string;
      clientName: string;
      principalBalance: number;
    }>,
    criteria: FuzzyMatchCriteria = DEFAULT_FUZZY_MATCH,
    confidenceThreshold: number = CONFIDENCE_THRESHOLDS.FAIR
  ): TransactionMatchSuggestion[] {
    const suggestions: TransactionMatchSuggestion[] = [];

    bankJoyTransactions.forEach((bankJoyTransaction) => {
      // Try reference number match first
      const referenceMatches = matters.filter((matter) =>
        matter.matterId === bankJoyTransaction.referenceNumber
      );

      if (referenceMatches.length === 1) {
        const matter = referenceMatches[0];
        suggestions.push({
          bankJoyTransactionId: bankJoyTransaction.id,
          referenceNumber: bankJoyTransaction.referenceNumber,
          amount: bankJoyTransaction.amount,
          transactionDate: bankJoyTransaction.transactionDate,
          matterId: matter.id,
          matterNumber: matter.matterId,
          clientName: matter.clientName,
          confidence: 1,
          matchType: 'reference_number',
        });
        return;
      }

      if (referenceMatches.length > 1) {
        // Multiple matches - add suggestions for all
        referenceMatches.forEach((matter) => {
          suggestions.push({
            bankJoyTransactionId: bankJoyTransaction.id,
            referenceNumber: bankJoyTransaction.referenceNumber,
            amount: bankJoyTransaction.amount,
            transactionDate: bankJoyTransaction.transactionDate,
            matterId: matter.id,
            matterNumber: matter.matterId,
            clientName: matter.clientName,
            confidence: 0.8,
            matchType: 'reference_number',
            reason: 'Multiple matters with same reference number',
          });
        });
        return;
      }

      // Try fuzzy match
      const fuzzyMatches = matters.filter((matter) => {
        // Amount match
        const amountDifference = Math.abs(bankJoyTransaction.amount - matter.principalBalance);
        const amountMatch = amountDifference <= (matter.principalBalance * criteria.amountTolerance);

        if (!amountMatch) {
          return false;
        }

        // Date match
        const transactionDate = new Date(bankJoyTransaction.transactionDate);
        const matterDate = new Date();
        const dateDifference = Math.abs(transactionDate.getTime() - matterDate.getTime()) / (1000 * 60 * 60 * 24);
        const dateMatch = dateDifference <= criteria.dateTolerance;

        if (!dateMatch) {
          return false;
        }

        return true;
      });

      if (fuzzyMatches.length === 0) {
        return;
      }

      // Find best fuzzy match
      let bestMatch = null;
      let bestConfidence = 0;

      fuzzyMatches.forEach((matter) => {
        const confidence = this.calculateFuzzyMatchConfidence(
          bankJoyTransaction,
          matter,
          criteria
        );

        if (confidence > bestConfidence) {
          bestMatch = matter;
          bestConfidence = confidence;
        }
      });

      if (!bestMatch || bestConfidence < confidenceThreshold) {
        return;
      }

      suggestions.push({
        bankJoyTransactionId: bankJoyTransaction.id,
        referenceNumber: bankJoyTransaction.referenceNumber,
        amount: bankJoyTransaction.amount,
        transactionDate: bankJoyTransaction.transactionDate,
        matterId: bestMatch.id,
        matterNumber: bestMatch.matterId,
        clientName: bestMatch.clientName,
        confidence: bestConfidence,
        matchType: 'amount_date',
        reason: `Matched by amount and date (confidence: ${(bestConfidence * 100).toFixed(0)}%)`,
      });
    });

    return suggestions;
  }

  /**
   * Detect unassigned transactions
   *
   * @param bankJoyTransactions - BankJoy transactions
   * @param matchedTransactionIds - Set of matched transaction IDs
   * @returns Array of unassigned transactions
   */
  detectUnassignedTransactions(
    bankJoyTransactions: Array<{
      id: string;
      referenceNumber: string;
    }>,
    matchedTransactionIds: Set<string>
  ): Array<{
    id: string;
    referenceNumber: string;
    status: 'unmatched';
    reason: string;
  }> {
    return bankJoyTransactions
      .filter((transaction) => !matchedTransactionIds.has(transaction.id))
      .map((transaction) => ({
        id: transaction.id,
        referenceNumber: transaction.referenceNumber,
        status: 'unmatched',
        reason: 'No matching matter found',
      }));
  }

  /**
   * Validate reference number format
   *
   * @param referenceNumber - Reference number to validate
   * @returns Whether reference number is valid
   */
  validateReferenceNumber(referenceNumber: string): boolean {
    return REFERENCE_NUMBER_REGEX.test(referenceNumber);
  }

  /**
   * Normalize reference number (format: XXXX-XXXX-XXXXX)
   *
   * @param referenceNumber - Reference number to normalize
   * @returns Normalized reference number
   */
  normalizeReferenceNumber(referenceNumber: string): string {
    // Remove non-alphanumeric characters
    return referenceNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Format reference number for display
   *
   * @param referenceNumber - Reference number to format
   * @returns Formatted reference number
   */
  formatReferenceNumber(referenceNumber: string): string {
    if (!referenceNumber) {
      return '';
    }

    // Add hyphens if needed (XXXX-XXXX-XXXXX format)
    const normalized = this.normalizeReferenceNumber(referenceNumber);

    if (normalized.length === 12) {
      return `${normalized.substring(0, 4)}-${normalized.substring(4, 8)}-${normalized.substring(8, 12)}`;
    }

    return normalized;
  }

  /**
   * Get match summary
   *
   * @param matches - Match results
   * @returns Match summary
   */
  getMatchSummary(matches: Map<string, MatchResult>): {
    totalTransactions: number;
    matchedTransactions: number;
    unmatchedTransactions: number;
    multipleMatchTransactions: number;
    averageConfidence: number;
  } {
    let matchedTransactions = 0;
    let unmatchedTransactions = 0;
    let multipleMatchTransactions = 0;
    let totalConfidence = 0;

    matches.forEach((match) => {
      switch (match.status) {
        case 'matched':
          matchedTransactions++;
          totalConfidence += match.confidence;
          break;

        case 'unmatched':
          unmatchedTransactions++;
          break;

        case 'multiple_matches':
          multipleMatchTransactions++;
          break;
      }
    });

    const averageConfidence = matchedTransactions > 0
      ? totalConfidence / matchedTransactions
      : 0;

    return {
      totalTransactions: matches.size,
      matchedTransactions,
      unmatchedTransactions,
      multipleMatchTransactions,
      averageConfidence,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

let bankJoyMatchingServiceInstance: BankJoyMatchingService | null = null;

/**
 * Get matching service singleton instance
 */
export function getBankJoyMatchingService(): BankJoyMatchingService {
  if (!bankJoyMatchingServiceInstance) {
    bankJoyMatchingServiceInstance = new BankJoyMatchingService();
  }
  return bankJoyMatchingServiceInstance;
}

/**
 * Reset matching service singleton (for testing)
 */
export function resetBankJoyMatchingService(): void {
  bankJoyMatchingServiceInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  BankJoyMatchingService,
  getBankJoyMatchingService,
  resetBankJoyMatchingService,
  type MatchResult,
  type TransactionMatchSuggestion,
  type FuzzyMatchCriteria,
  type ManualMatchRequest,
  type DEFAULT_FUZZY_MATCH,
  type CONFIDENCE_THRESHOLDS,
};
