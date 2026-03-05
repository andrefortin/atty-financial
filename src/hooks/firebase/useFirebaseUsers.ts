/**
 * Firebase Users Hook
 *
 * React Query integration for users collection with real-time subscriptions.
 *
 * @module hooks/firebase/useFirebaseUsers
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
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
  getUsersByRole,
  hasPermission,
  subscribeToFirmUsers,
  type OperationResult,
  type FirestoreDocument,
} from '@/services/firebase';
import type { FirestoreUser } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseUserOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreUser>>, 'queryKey'> {
  userId: string;
}

export interface UseFirmUsersOptions {
  firmId: string;
  includeInactive?: boolean;
  role?: FirestoreUser['data']['role'];
}

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to fetch a user by ID
 */
export function useUser(options: UseUserOptions) {
  const { userId, ...queryOptions } = options;

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const result = await getUserById(userId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch user');
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
}

/**
 * Hook to fetch users by firm
 */
export function useFirmUsers(options: UseFirmUsersOptions) {
  const { firmId, includeInactive, role, ...queryOptions } = options;

  return useQuery({
    queryKey: ['users', 'firm', firmId, { includeInactive, role }],
    queryFn: async () => {
      const result = await getUsersByFirm(firmId, {
        includeInactive,
        role,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      return result.data;
    },
    enabled: !!firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
}

/**
 * Hook to search users
 */
export function useSearchUsers(
  firmId: string,
  searchTerm: string,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreUser>[]>, 'queryKey'>
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users', 'search', firmId, searchTerm],
    queryFn: async () => {
      const result = await searchUsers(firmId, searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to search users');
      }
      return result.data;
    },
    enabled: !!firmId && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to get users by role
 */
export function useUsersByRole(
  firmId: string,
  role: FirestoreUser['data']['role'],
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreUser>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['users', 'role', firmId, role],
    queryFn: async () => {
      const result = await getUsersByRole(firmId, role);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      return result.data;
    },
    enabled: !!firmId && !!role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to check user permission
 */
export function useUserPermission(
  userId: string,
  permission: string,
  options?: Omit<UseQueryOptions<boolean>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['users', 'permission', userId, permission],
    queryFn: async () => {
      const result = await hasPermission(userId, permission);
      if (!result.success) {
        throw new Error(result.error || 'Failed to check permission');
      }
      return result.data ?? false;
    },
    enabled: !!userId && !!permission,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createUser>[0]) => {
      const result = await createUser(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create user');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate users queries
      queryClient.invalidateQueries({
        queryKey: ['users', 'firm', variables.firmId],
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'role'] });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
        userId: string;
        updates: Parameters<typeof updateUser>[1];
      }) => {
      const result = await updateUser(userId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }
      return result;
    },
    onSuccess: (result, variables) => {
      // Optimistic update
      queryClient.setQueryData(['user', variables.userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...variables.updates,
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }
      return result;
    },
    onSuccess: (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['user', userId] });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook to set user role
 */
export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: Parameters<typeof setUserRole>[1];
    }) => {
      const result = await setUserRole(userId, role);
      if (!result.success) {
        throw new Error(result.error || 'Failed to set user role');
      }
      return result;
    },
    onSuccess: (result, variables) => {
      // Optimistic update
      queryClient.setQueryData(['user', variables.userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            role: variables.role,
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook to deactivate a user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deactivateUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate user');
      }
      return result;
    },
    onSuccess: (result, userId) => {
      // Optimistic update
      queryClient.setQueryData(['user', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isActive: false,
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook to activate a user
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await activateUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate user');
      }
      return result;
    },
    onSuccess: (result, userId) => {
      // Optimistic update
      queryClient.setQueryData(['user', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isActive: true,
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook to update last login
 */
export function useUpdateLastLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await updateLastLogin(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update last login');
      }
      return result;
    },
    onSuccess: (_, userId) => {
      // Update cache
      queryClient.setQueryData(['user', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            lastLogin: Date.now(),
          },
        };
      });
    },
  });
}

// ============================================
// Real-time Subscription Hook
// ============================================

/**
 * Hook for real-time firm users subscription
 */
export function useFirmUsersRealtime(options: UseFirmUsersOptions) {
  const { firmId, includeInactive, role } = options;
  const [users, setUsers] = React.useState<FirestoreDocument<FirestoreUser>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFirmUsers(
      firmId,
      { includeInactive, role },
      (data) => {
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [firmId, includeInactive, role]);

  return { users, loading, error };
}
