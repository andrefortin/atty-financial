/**
 * Users Service
 *
 * Provides CRUD operations and role management for the users collection.
 *
 * @module services/firebase/users.service
 */

import {
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  executeTransaction,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
} from './firestore.service';
import type {
  FirestoreUser,
  FirestoreUserData,
  FirestoreUserRole,
  UserPermissions,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role: FirestoreUserRole;
  firmId: string;
  password?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  permissions?: Partial<UserPermissions>;
  preferences?: FirestoreUserData['preferences'];
}

/**
 * User update input
 */
export interface UpdateUserInput {
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  permissions?: Partial<UserPermissions>;
  preferences?: FirestoreUserData['preferences'];
  isActive?: boolean;
}

/**
 * User query filters
 */
export interface UserFilters {
  firmId?: string;
  role?: FirestoreUserRole;
  isActive?: boolean;
  search?: string;
}

/**
 * Login tracking input
 */
export interface LoginTrackingInput {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new user
 *
 * @param input - User creation data
 * @returns Operation result with created user document
 */
export async function createUser(
  input: CreateUserInput
): Promise<OperationResult<FirestoreDocument<FirestoreUser>>> {
  const userData: Omit<FirestoreUserData, 'createdAt' | 'updatedAt'> = {
    email: input.email.toLowerCase(),
    emailVerified: false,
    name: input.name,
    role: input.role,
    firmId: input.firmId,
    phoneNumber: input.phoneNumber,
    profileImageUrl: input.profileImageUrl,
    isActive: true,
    permissions: input.permissions,
    preferences: input.preferences,
  };

  return createDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userData);
}

/**
 * Create a user with specific ID
 *
 * @param userId - User ID (typically Firebase Auth UID)
 * @param input - User creation data
 * @returns Operation result with created user document
 */
export async function createUserWithId(
  userId: string,
  input: CreateUserInput
): Promise<OperationResult<FirestoreDocument<FirestoreUser>>> {
  const userData: Omit<FirestoreUserData, 'createdAt' | 'updatedAt'> = {
    email: input.email.toLowerCase(),
    emailVerified: false,
    name: input.name,
    role: input.role,
    firmId: input.firmId,
    phoneNumber: input.phoneNumber,
    profileImageUrl: input.profileImageUrl,
    isActive: true,
    permissions: input.permissions,
    preferences: input.preferences,
  };

  return createDocumentWithId<FirestoreUserData>(
    COLLECTION_NAMES.USERS,
    userId,
    userData
  );
}

/**
 * Get a user by ID
 *
 * @param userId - User ID
 * @returns Operation result with user document
 */
export async function getUserById(
  userId: string
): Promise<OperationResult<FirestoreDocument<FirestoreUser>>> {
  return getDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId);
}

/**
 * Get user by email (case-insensitive)
 *
 * @param email - User email
 * @returns Operation result with user document
 */
export async function getUserByEmail(
  email: string
): Promise<OperationResult<FirestoreDocument<FirestoreUser>>> {
  const result = await queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
    where: [
      {
        field: 'email',
        operator: '==',
        value: email.toLowerCase(),
      },
    ],
    limit: 1,
  });

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'User not found',
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data[0],
  };
}

/**
 * Get users by firm ID
 *
 * @param firmId - Firm ID
 * @param options - Query options (includeInactive, role)
 * @returns Operation result with user documents
 */
export async function getUsersByFirm(
  firmId: string,
  options?: {
    includeInactive?: boolean;
    role?: FirestoreUserRole;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreUser>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (!options?.includeInactive) {
    whereClauses.push(where('isActive', '==', true));
  }

  if (options?.role) {
    whereClauses.push(where('role', '==', options.role));
  }

  return queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
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
 * Update a user
 *
 * @param userId - User ID
 * @param updates - User update data
 * @returns Operation result
 */
export async function updateUser(
  userId: string,
  updates: UpdateUserInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(
    COLLECTION_NAMES.USERS,
    userId,
    updates
  );
}

/**
 * Delete a user
 *
 * @param userId - User ID
 * @returns Operation result
 */
export async function deleteUser(
  userId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.USERS, userId);
}

// ============================================
// Role Management
// ============================================

/**
 * Set user role
 *
 * @param userId - User ID
 * @param role - New role
 * @returns Operation result
 */
export async function setUserRole(
  userId: string,
  role: FirestoreUserRole
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId, {
    role,
    updatedAt: Date.now(),
  });
}

/**
 * Get user role
 *
 * @param userId - User ID
 * @returns Operation result with user role
 */
export async function getUserRole(
  userId: string
): Promise<OperationResult<FirestoreUserRole>> {
  const result = await getUserById(userId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: 'User not found',
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data.data.role,
  };
}

/**
 * Get users by role
 *
 * @param firmId - Firm ID
 * @param role - User role
 * @returns Operation result with user documents
 */
export async function getUsersByRole(
  firmId: string,
  role: FirestoreUserRole
): Promise<OperationResult<FirestoreDocument<FirestoreUser>[]>> {
  const result = await queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'role',
        operator: '==',
        value: role,
      },
      {
        field: 'isActive',
        operator: '==',
        value: true,
      },
    ],
    orderBy: [
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  return result;
}

/**
 * Check if user has permission
 *
 * @param userId - User ID
 * @param permission - Permission path (e.g., 'matters.create')
 * @returns Operation result with permission status
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<OperationResult<boolean>> {
  const result = await getUserById(userId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: 'User not found',
      code: 'not-found',
    };
  }

  const userData = result.data.data;
  const [category, action] = permission.split('.') as [
    keyof UserPermissions,
    string
  ];

  if (!userData.permissions) {
    return { success: true, data: false };
  }

  const categoryPermissions = userData.permissions[category];
  const hasAccess =
    categoryPermissions && categoryPermissions[action as keyof typeof categoryPermissions];

  return { success: true, data: !!hasAccess };
}

/**
 * Update user permissions
 *
 * @param userId - User ID
 * @param permissions - Partial permissions object
 * @returns Operation result
 */
export async function updateUserPermissions(
  userId: string,
  permissions: Partial<UserPermissions>
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId, {
    permissions,
    updatedAt: Date.now(),
  });
}

// ============================================
// Active/Inactive Management
// ============================================

/**
 * Deactivate a user
 *
 * @param userId - User ID
 * @returns Operation result
 */
export async function deactivateUser(
  userId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId, {
    isActive: false,
    updatedAt: Date.now(),
  });
}

/**
 * Activate a user
 *
 * @param userId - User ID
 * @returns Operation result
 */
export async function activateUser(
  userId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId, {
    isActive: true,
    updatedAt: Date.now(),
  });
}

/**
 * Get active users count for a firm
 *
 * @param firmId - Firm ID
 * @returns Operation result with count
 */
export async function getActiveUsersCount(
  firmId: string
): Promise<OperationResult<number>> {
  const result = await queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'isActive',
        operator: '==',
        value: true,
      },
    ],
  });

  return {
    success: result.success,
    data: result.data?.length || 0,
  };
}

// ============================================
// Login Tracking
// ============================================

/**
 * Update last login timestamp
 *
 * @param userId - User ID
 * @returns Operation result
 */
export async function updateLastLogin(
  userId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, userId, {
    lastLogin: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Update last login with tracking data
 *
 * @param input - Login tracking data
 * @returns Operation result
 */
export async function updateLastLoginWithTracking(
  input: LoginTrackingInput
): Promise<OperationResult<void>> {
  // Note: IP address and user agent would need to be tracked in a separate
  // login logs collection, as users collection doesn't store these
  return updateDocument<FirestoreUserData>(COLLECTION_NAMES.USERS, input.userId, {
    lastLogin: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Get users who haven't logged in recently
 *
 * @param firmId - Firm ID
 * @param days - Number of days since last login
 * @returns Operation result with user documents
 */
export async function getInactiveUsers(
  firmId: string,
  days: number = 30
): Promise<OperationResult<FirestoreDocument<FirestoreUser>[]>> {
  const thresholdDate = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'isActive',
        operator: '==',
        value: true,
      },
    ],
    orderBy: [
      {
        field: 'lastLogin',
        direction: 'asc',
      },
    ],
  });

  if (!result.success || !result.data) {
    return result;
  }

  // Filter by lastLogin date in memory ( Firestore doesn't support complex date comparisons directly)
  const inactiveUsers = result.data.filter(
    (user) => (user.data.lastLogin || 0) < thresholdDate
  );

  return {
    success: true,
    data: inactiveUsers,
  };
}

// ============================================
// User Search & Filtering
// ============================================

/**
 * Search users by name or email
 *
 * @param firmId - Firm ID
 * @param searchTerm - Search term
 * @returns Operation result with user documents
 */
export async function searchUsers(
  firmId: string,
  searchTerm: string
): Promise<OperationResult<FirestoreDocument<FirestoreUser>[]>> {
  // Get all active users for the firm
  const result = await getUsersByFirm(firmId, {
    includeInactive: false,
  });

  if (!result.success || !result.data) {
    return result;
  }

  // Filter by search term (case-insensitive)
  const searchLower = searchTerm.toLowerCase();
  const filteredUsers = result.data.filter(
    (user) =>
      user.data.name.toLowerCase().includes(searchLower) ||
      user.data.email.toLowerCase().includes(searchLower)
  );

  return {
    success: true,
    data: filteredUsers,
  };
}

/**
 * Get users matching filters
 *
 * @param filters - User filters
 * @returns Operation result with user documents
 */
export async function getUsersByFilters(
  filters: UserFilters
): Promise<OperationResult<FirestoreDocument<FirestoreUser>[]>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.firmId) {
    whereClauses.push(where('firmId', '==', filters.firmId));
  }

  if (filters.role) {
    whereClauses.push(where('role', '==', filters.role));
  }

  if (filters.isActive !== undefined) {
    whereClauses.push(where('isActive', '==', filters.isActive));
  }

  let result = await queryDocuments<FirestoreUserData>(COLLECTION_NAMES.USERS, {
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

  // Apply search filter if provided
  if (filters.search && result.success && result.data) {
    const searchLower = filters.search.toLowerCase();
    result.data = result.data.filter(
      (user) =>
        user.data.name.toLowerCase().includes(searchLower) ||
        user.data.email.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to user changes
 *
 * @param userId - User ID
 * @param onUpdate - Callback for user updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToUser(
  userId: string,
  onUpdate: (user: FirestoreDocument<FirestoreUser> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreUserData>(
    COLLECTION_NAMES.USERS,
    userId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to firm users
 *
 * @param firmId - Firm ID
 * @param options - Subscription options
 * @param onUpdate - Callback for users updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirmUsers(
  firmId: string,
  options?: {
    includeInactive?: boolean;
    role?: FirestoreUserRole;
  },
  onUpdate: (users: FirestoreDocument<FirestoreUser>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [where('firmId', '==', firmId)];

  if (!options?.includeInactive) {
    whereClauses.push(where('isActive', '==', true));
  }

  if (options?.role) {
    whereClauses.push(where('role', '==', options.role));
  }

  return subscribeToQuery<FirestoreUserData>(
    COLLECTION_NAMES.USERS,
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
