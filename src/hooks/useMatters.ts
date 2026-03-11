/**
 * useMatters Hook
 *
 * TanStack Query hook for managing matters data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMatters, createMatter, updateMatter, deleteMatter } from '../../services/api';

export interface UseMattersOptions {
  enabled?: boolean;
}

/**
 * Fetch all matters with TanStack Query
 */
export function useMatters(options: UseMattersOptions = {}) {
  return useQuery({
    queryKey: ['matters'],
    queryFn: fetchMatters,
    enabled: options.enabled !== undefined ? options.enabled : true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch single matter by ID
 */
export function useMatter(id: string, options: UseMattersOptions = {}) {
  return useQuery({
    queryKey: ['matter', id],
    queryFn: () => fetchMatter(id),
    enabled: options.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Create new matter mutation
 */
export function useCreateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMatter,
    onSuccess: () => {
      // Invalidate and refetch matters list
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (error) => {
      console.error('Failed to create matter:', error);
    },
  });
}

/**
 * Update matter mutation
 */
export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMatter,
    onSuccess: () => {
      // Invalidate and refetch matters list
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (error) => {
      console.error('Failed to update matter:', error);
    },
  });
}

/**
 * Delete matter mutation
 */
export function useDeleteMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMatter,
    onSuccess: () => {
      // Invalidate and refetch matters list
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (error) => {
      console.error('Failed to delete matter:', error);
    },
  });
}
