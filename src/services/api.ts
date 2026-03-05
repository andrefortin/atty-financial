/**
 * API Service
 *
 * Routes API calls to Firebase services while maintaining
 * backward compatibility with existing function signatures.
 *
 * @module services/api
 */

// Firebase services
import {
  // Users
  createUser,
  getUserById,
  getUsersByFirm,
  updateUser,
  deleteUser,
  setUserRole,
  getUserRole,
  deactivateUser,
  activateUser,
  updateLastLogin,
  searchUsers,
  // Firms
  createFirm,
  getFirmById,
  updateFirm,
  getFirmSettings,
  updateFirmSettings,
  // Matters
  createMatter,
  getMatterById,
  getMattersByFirm,
  updateMatter,
  deleteMatter,
  closeMatter,
  reopenMatter,
  searchMatters,
  // Transactions
  createTransaction,
  getTransactionById,
  getTransactionsByFirm,
  getTransactionsByMatter,
  updateTransaction,
  deleteTransaction,
  postTransaction,
  updateTransactionStatus,
  searchTransactions,
  // Types
  type OperationResult,
  type FirestoreDocument,
} from './firebase';

// Type definitions matching the expected API response structure
export interface Matter {
  id: string;
  clientId: string;
  clientName: string;
  status: 'Active' | 'Closed' | 'Archive';
  principalBalance: number;
  interestOwed: number;
  interestPaid: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  matterId: string;
  type: 'Draw' | 'Principal Payment' | 'Interest Autodraft';
  amount: number;
  date: string;
  description?: string;
  category?: string;
  status: 'Assigned' | 'Unassigned' | 'Partial';
}

export interface CreateMatterRequest {
  clientId: string;
  clientName: string;
  principalBalance?: number;
  notes?: string;
}

export interface UpdateMatterRequest {
  id: string;
  status?: 'Active' | 'Closed' | 'Archive';
  principalBalance?: number;
  notes?: string;
}

export interface CreateTransactionRequest {
  matterId: string;
  type: 'Draw' | 'Principal Payment' | 'Interest Autodraft';
  amount: number;
  date: string;
  description?: string;
  category?: string;
}

export interface UpdateTransactionRequest {
  id: string;
  matterId?: string;
  status?: 'Assigned' | 'Unassigned' | 'Partial';
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
}

/**
 * Simulated network delay to mimic real API calls
 */
const SIMULATED_DELAY = 100; // Reduced from 500ms for better UX

/**
 * Create a simulated delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert Firestore document to API Matter type
 */
function firestoreMatterToApiMatter(doc: FirestoreDocument<any>): Matter {
  return {
    id: doc.id,
    clientId: doc.id, // Using matter ID as client ID for compatibility
    clientName: doc.data.clientName || '',
    status: doc.data.status || 'Active',
    principalBalance: doc.data.principalBalance || 0,
    interestOwed: doc.data.totalInterestAccrued || 0,
    interestPaid: doc.data.interestPaid || 0,
    createdAt: new Date(doc.data.createdAt).toISOString(),
    updatedAt: new Date(doc.data.updatedAt || doc.data.createdAt).toISOString(),
    notes: doc.data.notes,
  };
}

/**
 * Convert Firestore document to API Transaction type
 */
function firestoreTransactionToApiTransaction(doc: FirestoreDocument<any>): Transaction {
  return {
    id: doc.id,
    matterId: doc.data.matterId || '',
    type: doc.data.type as any,
    amount: doc.data.amount || 0,
    date: new Date(doc.data.date).toISOString(),
    description: doc.data.description,
    category: doc.data.category,
    status: doc.data.status as any,
  };
}

// Type definitions matching the expected API response structure
export interface Matter {
  id: string;
  clientId: string;
  clientName: string;
  status: 'Active' | 'Closed' | 'Archive';
  principalBalance: number;
  interestOwed: number;
  interestPaid: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  matterId: string;
  type: 'Draw' | 'Principal Payment' | 'Interest Autodraft';
  amount: number;
  date: string;
  description?: string;
  category?: string;
  status: 'Assigned' | 'Unassigned' | 'Partial';
}

export interface CreateMatterRequest {
  clientId: string;
  clientName: string;
  principalBalance?: number;
  notes?: string;
}

export interface UpdateMatterRequest {
  id: string;
  status?: 'Active' | 'Closed' | 'Archive';
  principalBalance?: number;
  notes?: string;
}

export interface CreateTransactionRequest {
  matterId: string;
  type: 'Draw' | 'Principal Payment' | 'Interest Autodraft';
  amount: number;
  date: string;
  description?: string;
  category?: string;
}

export interface UpdateTransactionRequest {
  id: string;
  matterId?: string;
  status?: 'Assigned' | 'Unassigned' | 'Partial';
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
}

/**
 * Simulated network delay to mimic real API calls
 */
const SIMULATED_DELAY = 500; // 500ms delay

/**
 * Create a simulated delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Note: createMatter, updateMatter, deleteMatter, and updateTransaction are now imported
// from Firebase services. The implementations below provide backward compatibility.

/**
 * Mock fetch all matters (now using Firebase)
 */
export async function fetchMatters(): Promise<Matter[]> {
  // For now, return empty array - firms will be implemented
  // TODO: Get firmId from auth context
  await delay(SIMULATED_DELAY);
  return [];
}

/**
 * Fetch single matter by ID (now using Firebase)
 */
export async function fetchMatter(id: string): Promise<Matter> {
  await delay(SIMULATED_DELAY);
  const result = await getMatterById(id);

  if (!result.success || !result.data) {
    throw new Error(`Matter not found: ${id}`);
  }

  return firestoreMatterToApiMatter(result.data);
}

/**
 * Create a new matter (now using Firebase)
 */
export async function createMatter(request: CreateMatterRequest): Promise<Matter> {
  await delay(SIMULATED_DELAY);

  // TODO: Get firmId from auth context
  const firmId = 'default-firm-id';

  const result = await createMatter({
    matterNumber: request.clientId,
    clientName: request.clientName,
    principal: request.principalBalance || 0,
    notes: request.notes,
    firmId,
    matterType: 'Personal Injury',
    status: 'Active',
  });

  if (!result.success || !result.data) {
    throw new Error('Failed to create matter');
  }

  return firestoreMatterToApiMatter(result.data);
}

/**
 * Update an existing matter (now using Firebase)
 */
export async function updateMatter(request: UpdateMatterRequest): Promise<Matter> {
  await delay(SIMULATED_DELAY);

  const result = await updateMatter(request.id, {
    status: request.status,
    principalBalance: request.principalBalance,
    notes: request.notes,
  });

  if (!result.success) {
    throw new Error(`Failed to update matter: ${request.id}`);
  }

  // Fetch updated matter
  const updated = await fetchMatter(request.id);
  return updated;
}

/**
 * Delete a matter (now using Firebase)
 */
export async function deleteMatter(id: string): Promise<void> {
  await delay(SIMULATED_DELAY);
  const result = await deleteMatter(id);

  if (!result.success) {
    throw new Error(`Failed to delete matter: ${id}`);
  }
}

/**
 * Fetch all transactions (now using Firebase)
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  // TODO: Get firmId from auth context
  await delay(SIMULATED_DELAY);
  return [];
}

/**
 * Fetch transactions by matter ID (now using Firebase)
 */
export async function fetchTransactionsByMatter(matterId: string): Promise<Transaction[]> {
  await delay(SIMULATED_DELAY);
  const result = await getTransactionsByMatter(matterId);

  if (!result.success || !result.data) {
    return [];
  }

  return result.data.map(firestoreTransactionToApiTransaction);
}

/**
 * Create a new transaction (now using Firebase)
 */
export async function createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
  await delay(SIMULATED_DELAY);

  // TODO: Get firmId from auth context
  const firmId = 'default-firm-id';

  const result = await createTransaction({
    matterId: request.matterId,
    type: request.type.toLowerCase() as any,
    amount: request.amount,
    date: new Date(request.date).getTime(),
    description: request.description,
    category: request.category,
    firmId,
  });

  if (!result.success || !result.data) {
    throw new Error('Failed to create transaction');
  }

  return firestoreTransactionToApiTransaction(result.data);
}

/**
 * Update an existing transaction (now using Firebase)
 */
export async function updateTransaction(request: UpdateTransactionRequest): Promise<Transaction> {
  await delay(SIMULATED_DELAY);

  const result = await updateTransaction(request.id, {
    matterId: request.matterId,
    status: request.status as any,
    amount: request.amount,
    date: request.date ? new Date(request.date).getTime() : undefined,
    description: request.description,
    category: request.category,
  });

  if (!result.success) {
    throw new Error(`Failed to update transaction: ${request.id}`);
  }

  // Fetch updated transaction
  const updated = await getTransactionById(request.id);

  if (!updated.success || !updated.data) {
    throw new Error(`Transaction not found: ${request.id}`);
  }

  return firestoreTransactionToApiTransaction(updated.data);
}

/**
 * Fetch firm data (now using Firebase)
 */
export async function fetchFirm(): Promise<{ name: string; email: string }> {
  await delay(SIMULATED_DELAY);

  // TODO: Get firmId from auth context
  const firmId = 'default-firm-id';
  const result = await getFirmById(firmId);

  if (!result.success || !result.data) {
    // Return default if not found
    return {
      name: 'Default Firm',
      email: 'firm@example.com',
    };
  }

  return {
    name: result.data.data.name,
    email: result.data.data.contactEmail,
  };
}

/**
 * Update firm data (now using Firebase)
 */
export async function updateFirm(data: { name?: string; email?: string }): Promise<{ name: string; email: string }> {
  await delay(SIMULATED_DELAY);

  // TODO: Get firmId from auth context
  const firmId = 'default-firm-id';

  const result = await updateFirm(firmId, {
    name: data.name,
    contactEmail: data.email,
  });

  if (!result.success) {
    throw new Error('Failed to update firm');
  }

  // Fetch updated firm
  return fetchFirm();
}

/**
 * API error for error handling
 */
export class ApiError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Throw an API error
 */
export function throwApiError(message: string, statusCode: number = 500): never {
  throw new ApiError(message, statusCode);
}

/**
 * Mock API error for testing error handling
 */
export class ApiError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Throw an API error
 */
export function throwApiError(message: string, statusCode: number = 500): never {
  throw new ApiError(message, statusCode);
}
