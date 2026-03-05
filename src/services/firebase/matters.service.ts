/**
 * Matters Service
 *
 * Provides CRUD operations and query management for the matters collection.
 *
 * @module services/firebase/matters.service
 */

import {
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  queryDocumentsPaginated,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
  type PaginatedResult,
  type PaginationOptions,
} from './firestore.service';
import type { FirestoreMatter, FirestoreMatterData } from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Matter creation input
 */
export interface CreateMatterInput {
  matterNumber: string;
  clientName: string;
  matterType: FirestoreMatterData['matterType'];
  status?: FirestoreMatterData['status'];
  principal?: number;
  interestRate?: number;
  openDate?: number;
  description?: string;
  notes?: string;
  firmId: string;
  assignedAttorneyId?: string;
  tags?: string[];
}

/**
 * Matter update input
 */
export interface UpdateMatterInput {
  clientName?: string;
  matterType?: FirestoreMatterData['matterType'];
  status?: FirestoreMatterData['status'];
  principal?: number;
  interestRate?: number;
  closeDate?: number;
  description?: string;
  notes?: string;
  assignedAttorneyId?: string;
  tags?: string[];
  // Cached calculated fields
  totalDraws?: number;
  totalPrincipalPayments?: number;
  totalInterestAccrued?: number;
  interestPaid?: number;
  principalBalance?: number;
  totalOwed?: number;
}

/**
 * Matter query filters
 */
export interface MatterFilters {
  firmId: string;
  status?: FirestoreMatterData['status'];
  matterType?: FirestoreMatterData['matterType'];
  assignedAttorneyId?: string;
  clientNameSearch?: string;
  dateFrom?: number;
  dateTo?: number;
  includeInactive?: boolean;
  tags?: string[];
}

/**
 * Matter sort options
 */
export interface MatterSortOptions {
  field: 'createdAt' | 'openDate' | 'clientName' | 'status' | 'principalBalance';
  direction: 'asc' | 'desc';
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new matter
 *
 * @param input - Matter creation data
 * @returns Operation result with created matter document
 */
export async function createMatter(
  input: CreateMatterInput
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>>> {
  const matterData: Omit<FirestoreMatterData, 'createdAt' | 'updatedAt'> = {
    matterNumber: input.matterNumber,
    clientName: input.clientName,
    matterType: input.matterType,
    status: input.status || 'Active',
    principal: input.principal || 0,
    interestRate: input.interestRate || 11.0,
    openDate: input.openDate || Date.now(),
    closeDate: undefined,
    description: input.description,
    notes: input.notes,
    firmId: input.firmId,
    assignedAttorneyId: input.assignedAttorneyId,
    tags: input.tags || [],
    // Initialize cached fields
    totalDraws: 0,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 0,
    interestPaid: 0,
    principalBalance: input.principal || 0,
    totalOwed: input.principal || 0,
  };

  return createDocument<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, matterData);
}

/**
 * Create a matter with specific ID
 *
 * @param matterId - Matter ID
 * @param input - Matter creation data
 * @returns Operation result with created matter document
 */
export async function createMatterWithId(
  matterId: string,
  input: CreateMatterInput
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>>> {
  const matterData: Omit<FirestoreMatterData, 'createdAt' | 'updatedAt'> = {
    matterNumber: input.matterNumber,
    clientName: input.clientName,
    matterType: input.matterType,
    status: input.status || 'Active',
    principal: input.principal || 0,
    interestRate: input.interestRate || 11.0,
    openDate: input.openDate || Date.now(),
    closeDate: undefined,
    description: input.description,
    notes: input.notes,
    firmId: input.firmId,
    assignedAttorneyId: input.assignedAttorneyId,
    tags: input.tags || [],
    totalDraws: 0,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 0,
    interestPaid: 0,
    principalBalance: input.principal || 0,
    totalOwed: input.principal || 0,
  };

  return createDocumentWithId<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    matterId,
    matterData
  );
}

/**
 * Get a matter by ID
 *
 * @param matterId - Matter ID
 * @returns Operation result with matter document
 */
export async function getMatterById(
  matterId: string
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>>> {
  return getDocument<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, matterId);
}

/**
 * Get matter by matter number
 *
 * @param firmId - Firm ID
 * @param matterNumber - Matter number
 * @returns Operation result with matter document
 */
export async function getMatterByNumber(
  firmId: string,
  matterNumber: string
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>>> {
  const result = await queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'matterNumber',
        operator: '==',
        value: matterNumber,
      },
    ],
    limit: 1,
  });

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'Matter not found',
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data[0],
  };
}

/**
 * Update a matter
 *
 * @param matterId - Matter ID
 * @param updates - Matter update data
 * @returns Operation result
 */
export async function updateMatter(
  matterId: string,
  updates: UpdateMatterInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    matterId,
    updates
  );
}

/**
 * Delete a matter
 *
 * @param matterId - Matter ID
 * @returns Operation result
 */
export async function deleteMatter(
  matterId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.MATTERS, matterId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get matters by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (includeInactive, status, assignedAttorneyId)
 * @returns Operation result with matter documents
 */
export async function getMattersByFirm(
  firmId: string,
  options?: {
    includeInactive?: boolean;
    status?: FirestoreMatterData['status'];
    assignedAttorneyId?: string;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (!options?.includeInactive) {
    whereClauses.push(where('status', '==', 'Active'));
  } else if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.assignedAttorneyId) {
    whereClauses.push(where('assignedAttorneyId', '==', options.assignedAttorneyId));
  }

  return queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: whereClauses.map((clause) => ({
      field: clause.field as string,
      operator: clause.operator as any,
      value: clause.value,
    })),
    orderBy: [
      {
        field: 'openDate',
        direction: 'desc',
      },
    ],
  });
}

/**
 * Get matters with pagination
 *
 * @param filters - Matter filters
 * @param pagination - Pagination options
 * @param sort - Sort options
 * @returns Operation result with paginated matters
 */
export async function getMattersPaginated(
  filters: MatterFilters,
  pagination?: PaginationOptions,
  sort?: MatterSortOptions
): Promise<OperationResult<PaginatedResult<FirestoreMatter>>> {
  const whereClauses: QueryConstraint[] = [];

  if (!filters.includeInactive) {
    whereClauses.push(where('status', '==', 'Active'));
  } else if (filters.status) {
    whereClauses.push(where('status', '==', filters.status));
  }

  if (filters.matterType) {
    whereClauses.push(where('matterType', '==', filters.matterType));
  }

  if (filters.assignedAttorneyId) {
    whereClauses.push(where('assignedAttorneyId', '==', filters.assignedAttorneyId));
  }

  if (filters.dateFrom) {
    whereClauses.push(where('openDate', '>=', filters.dateFrom));
  }

  if (filters.dateTo) {
    whereClauses.push(where('openDate', '<=', filters.dateTo));
  }

  if (filters.tags && filters.tags.length > 0) {
    whereClauses.push(where('tags', 'array-contains-any', filters.tags));
  }

  const orderByClauses = sort
    ? [
        {
          field: sort.field,
          direction: sort.direction,
        },
      ]
    : [
        {
          field: 'openDate',
          direction: 'desc',
        },
      ];

  const result = await queryDocumentsPaginated<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    pagination,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: orderByClauses,
    }
  );

  // Apply client name search filter if provided
  if (filters.clientNameSearch && result.success && result.data) {
    const searchLower = filters.clientNameSearch.toLowerCase();
    result.data.data = result.data.data.filter((matter) =>
      matter.data.clientName.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

/**
 * Get matters by date range
 *
 * @param firmId - Firm ID
 * @param startDate - Start date
 * @param endDate - End date
 * @param options - Query options (status)
 * @returns Operation result with matter documents
 */
export async function getMattersByDateRange(
  firmId: string,
  startDate: number,
  endDate: number,
  options?: {
    status?: FirestoreMatterData['status'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('openDate', '>=', startDate),
    where('openDate', '<=', endDate),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: whereClauses.map((clause) => ({
      field: clause.field as string,
      operator: clause.operator as any,
      value: clause.value,
    })),
    orderBy: [
      {
        field: 'openDate',
        direction: 'desc',
      },
    ],
  });
}

/**
 * Get matters by client name
 *
 * @param firmId - Firm ID
 * @param clientName - Client name (partial match)
 * @param options - Query options (status)
 * @returns Operation result with matter documents
 */
export async function getMattersByClientName(
  firmId: string,
  clientName: string,
  options?: {
    status?: FirestoreMatterData['status'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  const result = await getMattersByFirm(firmId, options);

  if (!result.success || !result.data) {
    return result;
  }

  const searchLower = clientName.toLowerCase();
  const filteredMatters = result.data.filter((matter) =>
    matter.data.clientName.toLowerCase().includes(searchLower)
  );

  return {
    success: true,
    data: filteredMatters,
  };
}

// ============================================
// Matter Status Transitions
// ============================================

/**
 * Close a matter
 *
 * @param matterId - Matter ID
 * @param closeDate - Close date (defaults to now)
 * @returns Operation result
 */
export async function closeMatter(
  matterId: string,
  closeDate?: number
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, matterId, {
    status: 'Closed',
    closeDate: closeDate || Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Archive a matter
 *
 * @param matterId - Matter ID
 * @returns Operation result
 */
export async function archiveMatter(
  matterId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, matterId, {
    status: 'Archive',
    updatedAt: Date.now(),
  });
}

/**
 * Reopen a matter
 *
 * @param matterId - Matter ID
 * @returns Operation result
 */
export async function reopenMatter(
  matterId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, matterId, {
    status: 'Active',
    closeDate: undefined,
    updatedAt: Date.now(),
  });
}

/**
 * Get matters with specific status
 *
 * @param firmId - Firm ID
 * @param status - Matter status
 * @returns Operation result with matter documents
 */
export async function getMattersByStatus(
  firmId: string,
  status: FirestoreMatterData['status']
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'status',
        operator: '==',
        value: status,
      },
    ],
    orderBy: [
      {
        field: 'openDate',
        direction: 'desc',
      },
    ],
  });
}

/**
 * Get active matters
 *
 * @param firmId - Firm ID
 * @returns Operation result with active matter documents
 */
export async function getActiveMatters(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return getMattersByStatus(firmId, 'Active');
}

/**
 * Get closed matters
 *
 * @param firmId - Firm ID
 * @returns Operation result with closed matter documents
 */
export async function getClosedMatters(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return getMattersByStatus(firmId, 'Closed');
}

// ============================================
// Search & Filtering
// ============================================

/**
 * Search matters
 *
 * @param firmId - Firm ID
 * @param searchTerm - Search term (searches client name, matter number, description)
 * @param options - Search options (status, matterType)
 * @returns Operation result with matter documents
 */
export async function searchMatters(
  firmId: string,
  searchTerm: string,
  options?: {
    status?: FirestoreMatterData['status'];
    matterType?: FirestoreMatterData['matterType'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  const result = await getMattersByFirm(firmId, {
    includeInactive: true,
    status: options?.status,
  });

  if (!result.success || !result.data) {
    return result;
  }

  const searchLower = searchTerm.toLowerCase();
  const filteredMatters = result.data.filter(
    (matter) =>
      matter.data.clientName.toLowerCase().includes(searchLower) ||
      matter.data.matterNumber.toLowerCase().includes(searchLower) ||
      matter.data.description?.toLowerCase().includes(searchLower)
  );

  // Apply matter type filter if provided
  if (options?.matterType) {
    filteredMatters.filter((matter) => matter.data.matterType === options.matterType);
  }

  return {
    success: true,
    data: filteredMatters,
  };
}

/**
 * Get matters with filters
 *
 * @param filters - Matter filters
 * @returns Operation result with matter documents
 */
export async function getMattersByFilters(
  filters: MatterFilters
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return getMattersByFirm(filters.firmId, {
    includeInactive: filters.includeInactive,
    status: filters.status,
    assignedAttorneyId: filters.assignedAttorneyId,
  });
}

/**
 * Get matters by attorney
 *
 * @param attorneyId - Attorney user ID
 * @returns Operation result with matter documents
 */
export async function getMattersByAttorney(
  attorneyId: string
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: [
      {
        field: 'assignedAttorneyId',
        operator: '==',
        value: attorneyId,
      },
      {
        field: 'status',
        operator: '==',
        value: 'Active',
      },
    ],
    orderBy: [
      {
        field: 'openDate',
        direction: 'desc',
      },
    ],
  });
}

/**
 * Get matters by tags
 *
 * @param firmId - Firm ID
 * @param tags - Array of tags to match
 * @returns Operation result with matter documents
 */
export async function getMattersByTags(
  firmId: string,
  tags: string[]
): Promise<OperationResult<FirestoreDocument<FirestoreMatter>[]>> {
  return queryDocuments<FirestoreMatterData>(COLLECTION_NAMES.MATTERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'status',
        operator: '==',
        value: 'Active',
      },
      {
        field: 'tags',
        operator: 'array-contains-any',
        value: tags,
      },
    ],
    orderBy: [
      {
        field: 'openDate',
        direction: 'desc',
      },
    ],
  });
}

// ============================================
// Cached Fields Updates
// ============================================

/**
 * Update cached matter calculations
 *
 * @param matterId - Matter ID
 * @param updates - Cached field updates
 * @returns Operation result
 */
export async function updateMatterCache(
  matterId: string,
  updates: {
    totalDraws?: number;
    totalPrincipalPayments?: number;
    totalInterestAccrued?: number;
    interestPaid?: number;
    principalBalance?: number;
    totalOwed?: number;
  }
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    matterId,
    updates
  );
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to matter changes
 *
 * @param matterId - Matter ID
 * @param onUpdate - Callback for matter updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToMatter(
  matterId: string,
  onUpdate: (matter: FirestoreDocument<FirestoreMatter> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    matterId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to firm matters
 *
 * @param firmId - Firm ID
 * @param options - Subscription options
 * @param onUpdate - Callback for matters updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirmMatters(
  firmId: string,
  options?: {
    status?: FirestoreMatterData['status'];
    assignedAttorneyId?: string;
  },
  onUpdate: (matters: FirestoreDocument<FirestoreMatter>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.assignedAttorneyId) {
    whereClauses.push(where('assignedAttorneyId', '==', options.assignedAttorneyId));
  }

  return subscribeToQuery<FirestoreMatterData>(
    COLLECTION_NAMES.MATTERS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'openDate',
          direction: 'desc',
        },
      ],
    },
    onUpdate,
    onError
  );
}
