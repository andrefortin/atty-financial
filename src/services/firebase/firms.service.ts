/**
 * Firms Service
 *
 * Provides CRUD operations and settings management for the firms collection.
 *
 * @module services/firebase/firms.service
 */

import { query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
} from './firestore.service';
import type { FirestoreFirm, FirestoreFirmData } from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Firm creation input
 */
export interface CreateFirmInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  logoUrl?: string;
  settings?: FirestoreFirmData['settings'];
  subscriptionTier?: FirestoreFirmData['subscriptionTier'];
  subscriptionExpiresAt?: number;
  stripeCustomerId?: string;
}

/**
 * Firm update input
 */
export interface UpdateFirmInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  logoUrl?: string;
  settings?: Partial<FirestoreFirmData['settings']>;
  isActive?: boolean;
  subscriptionTier?: FirestoreFirmData['subscriptionTier'];
  subscriptionExpiresAt?: number;
  stripeCustomerId?: string;
}

/**
 * Firm settings update input
 */
export interface UpdateFirmSettingsInput {
  dayCountConvention?: 'ACT/360' | 'ACT/365' | '30/360';
  roundingMethod?: 'Standard' | 'Bankers';
  primeRateModifier?: number;
  lineOfCreditLimit?: number;
  complianceCertified?: boolean;
  complianceCertifiedAt?: number;
  complianceCertifiedBy?: string;
  autoAllocateInterest?: boolean;
  bankFeedEnabled?: boolean;
  defaultPaymentTerms?: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new firm
 *
 * @param input - Firm creation data
 * @returns Operation result with created firm document
 */
export async function createFirm(
  input: CreateFirmInput
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>>> {
  const firmData: Omit<FirestoreFirmData, 'createdAt' | 'updatedAt'> = {
    name: input.name,
    contactEmail: input.contactEmail.toLowerCase(),
    contactPhone: input.contactPhone,
    address: input.address || {},
    logoUrl: input.logoUrl,
    settings: input.settings || {
      dayCountConvention: 'ACT/360',
      roundingMethod: 'Standard',
      primeRateModifier: 2.5,
      lineOfCreditLimit: 500000,
      complianceCertified: false,
    },
    isActive: true,
    subscriptionTier: input.subscriptionTier || 'Free',
    subscriptionExpiresAt: input.subscriptionExpiresAt,
    stripeCustomerId: input.stripeCustomerId,
  };

  return createDocument<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, firmData);
}

/**
 * Create a firm with specific ID
 *
 * @param firmId - Firm ID
 * @param input - Firm creation data
 * @returns Operation result with created firm document
 */
export async function createFirmWithId(
  firmId: string,
  input: CreateFirmInput
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>>> {
  const firmData: Omit<FirestoreFirmData, 'createdAt' | 'updatedAt'> = {
    name: input.name,
    contactEmail: input.contactEmail.toLowerCase(),
    contactPhone: input.contactPhone,
    address: input.address || {},
    logoUrl: input.logoUrl,
    settings: input.settings || {
      dayCountConvention: 'ACT/360',
      roundingMethod: 'Standard',
      primeRateModifier: 2.5,
      lineOfCreditLimit: 500000,
      complianceCertified: false,
    },
    isActive: true,
    subscriptionTier: input.subscriptionTier || 'Free',
    subscriptionExpiresAt: input.subscriptionExpiresAt,
    stripeCustomerId: input.stripeCustomerId,
  };

  return createDocumentWithId<FirestoreFirmData>(
    COLLECTION_NAMES.FIRMS,
    firmId,
    firmData
  );
}

/**
 * Get a firm by ID
 *
 * @param firmId - Firm ID
 * @returns Operation result with firm document
 */
export async function getFirmById(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>>> {
  return getDocument<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, firmId);
}

/**
 * Get all firms
 *
 * @param options - Query options (includeInactive)
 * @returns Operation result with firm documents
 */
export async function getAllFirms(options?: {
  includeInactive?: boolean;
}): Promise<OperationResult<FirestoreDocument<FirestoreFirm>[]>> {
  const whereClauses: QueryConstraint[] = [];

  if (!options?.includeInactive) {
    whereClauses.push(where('isActive', '==', true));
  }

  return queryDocuments<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, {
    where: whereClauses.map((clause) => ({
      field: clause.field as string,
      operator: clause.operator as any,
      value: clause.value,
    })),
    orderBy: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });
}

/**
 * Update a firm
 *
 * @param firmId - Firm ID
 * @param updates - Firm update data
 * @returns Operation result
 */
export async function updateFirm(
  firmId: string,
  updates: UpdateFirmInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreFirmData>(
    COLLECTION_NAMES.FIRMS,
    firmId,
    updates
  );
}

/**
 * Delete a firm
 *
 * @param firmId - Firm ID
 * @returns Operation result
 */
export async function deleteFirm(
  firmId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.FIRMS, firmId);
}

// ============================================
// Firm Settings Management
// ============================================

/**
 * Get firm settings
 *
 * @param firmId - Firm ID
 * @returns Operation result with firm settings
 */
export async function getFirmSettings(
  firmId: string
): Promise<OperationResult<FirestoreFirmData['settings']>> {
  const result = await getFirmById(firmId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: 'Firm not found',
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data.data.settings,
  };
}

/**
 * Update firm settings
 *
 * @param firmId - Firm ID
 * @param settings - Settings updates
 * @returns Operation result
 */
export async function updateFirmSettings(
  firmId: string,
  settings: UpdateFirmSettingsInput
): Promise<OperationResult<void>> {
  const result = await getFirmById(firmId);
  if (!result.success || !result.data) {
    return {
      success: false,
      error: 'Firm not found',
      code: 'not-found',
    };
  }

  return updateDocument<FirestoreFirmData>(
    COLLECTION_NAMES.FIRMS,
    firmId,
    {
      settings: {
        ...result.data.data.settings,
        ...settings,
      },
      updatedAt: Date.now(),
    }
  );
}

/**
 * Set compliance certification
 *
 * @param firmId - Firm ID
 * @param certified - Whether firm is compliant
 * @param certifiedBy - User ID certifying compliance
 * @returns Operation result
 */
export async function setComplianceCertification(
  firmId: string,
  certified: boolean,
  certifiedBy?: string
): Promise<OperationResult<void>> {
  return updateFirmSettings(firmId, {
    complianceCertified: certified,
    complianceCertifiedAt: certified ? Date.now() : undefined,
    complianceCertifiedBy: certified ? certifiedBy : undefined,
  });
}

/**
 * Get compliance certification status
 *
 * @param firmId - Firm ID
 * @returns Operation result with certification status
 */
export async function getComplianceStatus(
  firmId: string
): Promise<OperationResult<{ certified: boolean; certifiedAt?: number }>> {
  const result = await getFirmSettings(firmId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: 'Firm not found',
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: {
      certified: result.data.complianceCertified,
      certifiedAt: result.data.complianceCertifiedAt,
    },
  };
}

// ============================================
// Active/Inactive Management
// ============================================

/**
 * Deactivate a firm
 *
 * @param firmId - Firm ID
 * @returns Operation result
 */
export async function deactivateFirm(
  firmId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, firmId, {
    isActive: false,
    updatedAt: Date.now(),
  });
}

/**
 * Activate a firm
 *
 * @param firmId - Firm ID
 * @returns Operation result
 */
export async function activateFirm(
  firmId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, firmId, {
    isActive: true,
    updatedAt: Date.now(),
  });
}

/**
 * Get active firms
 *
 * @returns Operation result with active firm documents
 */
export async function getActiveFirms(): Promise<
  OperationResult<FirestoreDocument<FirestoreFirm>[]>
> {
  return getAllFirms({ includeInactive: false });
}

/**
 * Get inactive firms
 *
 * @returns Operation result with inactive firm documents
 */
export async function getInactiveFirms(): Promise<
  OperationResult<FirestoreDocument<FirestoreFirm>[]>
> {
  return queryDocuments<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, {
    where: [
      {
        field: 'isActive',
        operator: '==',
        value: false,
      },
    ],
    orderBy: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });
}

// ============================================
// Subscription Management
// ============================================

/**
 * Update subscription tier
 *
 * @param firmId - Firm ID
 * @param tier - New subscription tier
 * @param expiresAt - Expiration date (optional)
 * @returns Operation result
 */
export async function updateSubscriptionTier(
  firmId: string,
  tier: FirestoreFirmData['subscriptionTier'],
  expiresAt?: number
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, firmId, {
    subscriptionTier: tier,
    subscriptionExpiresAt: expiresAt,
    updatedAt: Date.now(),
  });
}

/**
 * Get firms with expiring subscriptions
 *
 * @param days - Days until expiration
 * @returns Operation result with firm documents
 */
export async function getFirmsWithExpiringSubscriptions(
  days: number = 30
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>[]>> {
  const result = await getAllFirms();

  if (!result.success || !result.data) {
    return result;
  }

  const now = Date.now();
  const thresholdDate = now + days * 24 * 60 * 60 * 1000;

  const expiringFirms = result.data.filter((firm) => {
    const expiresAt = firm.data.subscriptionExpiresAt;
    return expiresAt && expiresAt <= thresholdDate && expiresAt > now;
  });

  return {
    success: true,
    data: expiringFirms,
  };
}

/**
 * Get firms with expired subscriptions
 *
 * @returns Operation result with firm documents
 */
export async function getFirmsWithExpiredSubscriptions(): Promise<
  OperationResult<FirestoreDocument<FirestoreFirm>[]>
> {
  const result = await getAllFirms();

  if (!result.success || !result.data) {
    return result;
  }

  const now = Date.now();
  const expiredFirms = result.data.filter(
    (firm) => firm.data.subscriptionExpiresAt && firm.data.subscriptionExpiresAt < now
  );

  return {
    success: true,
    data: expiredFirms,
  };
}

// ============================================
// Search & Filtering
// ============================================

/**
 * Search firms by name or contact email
 *
 * @param searchTerm - Search term
 * @param options - Search options (includeInactive)
 * @returns Operation result with firm documents
 */
export async function searchFirms(
  searchTerm: string,
  options?: {
    includeInactive?: boolean;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>[]>> {
  const result = await getAllFirms(options);

  if (!result.success || !result.data) {
    return result;
  }

  const searchLower = searchTerm.toLowerCase();
  const filteredFirms = result.data.filter(
    (firm) =>
      firm.data.name.toLowerCase().includes(searchLower) ||
      firm.data.contactEmail.toLowerCase().includes(searchLower)
  );

  return {
    success: true,
    data: filteredFirms,
  };
}

/**
 * Get firms by subscription tier
 *
 * @param tier - Subscription tier
 * @returns Operation result with firm documents
 */
export async function getFirmsBySubscriptionTier(
  tier: FirestoreFirmData['subscriptionTier']
): Promise<OperationResult<FirestoreDocument<FirestoreFirm>[]>> {
  return queryDocuments<FirestoreFirmData>(COLLECTION_NAMES.FIRMS, {
    where: [
      {
        field: 'subscriptionTier',
        operator: '==',
        value: tier,
      },
    ],
    orderBy: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to firm changes
 *
 * @param firmId - Firm ID
 * @param onUpdate - Callback for firm updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirm(
  firmId: string,
  onUpdate: (firm: FirestoreDocument<FirestoreFirm> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreFirmData>(
    COLLECTION_NAMES.FIRMS,
    firmId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to all firms
 *
 * @param options - Subscription options
 * @param onUpdate - Callback for firms updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirms(
  options?: {
    includeInactive?: boolean;
  },
  onUpdate: (firms: FirestoreDocument<FirestoreFirm>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [];

  if (!options?.includeInactive) {
    whereClauses.push(where('isActive', '==', true));
  }

  return subscribeToQuery<FirestoreFirmData>(
    COLLECTION_NAMES.FIRMS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
    },
    onUpdate,
    onError
  );
}
