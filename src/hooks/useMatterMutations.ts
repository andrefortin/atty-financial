/**
 * useMatterMutations Hook
 *
 * TanStack Query mutation hooks for matter operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMatter, updateMatter, deleteMatter } from '../../services/api';

/**
 * Create matter mutation with optimistic updates
 */
export function useCreateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMatter,
    onMutate: async (newMatter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters'] });

      // Get current data
      const previousMatters = queryClient.getQueryData(['matters']);

      // Optimistically add new matter
      queryClient.setQueryData(['matters'], [...(previousMatters || []), newMatter]);

      return { previousMatters };
    },
    onSuccess: (result, variables, context) => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters);
      }
    },
  });
}

/**
 * Update matter mutation with optimistic updates
 */
export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMatter,
    onMutate: async (updatedMatter) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters', updatedMatter.id] });

      // Get current data
      const previousMatters = queryClient.getQueryData(['matters']);
      const previousMatter = previousMatters?.find(m => m.id === updatedMatter.id);

      // Optimistically update matter
      queryClient.setQueryData(
        ['matters'],
        previousMatters?.map(m => m.id === updatedMatter.id ? updatedMatter : m) || []
      );
      queryClient.setQueryData(['matter', updatedMatter.id], updatedMatter);

      return { previousMatters, previousMatter };
    },
    onSuccess: (result, variables, context) => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['matters'], ['matter', variables.id] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters);
      }
      if (context?.previousMatter) {
        queryClient.setQueryData(['matter', variables.id], context.previousMatter);
      }
    },
  });
}

/**
 * Delete matter mutation with optimistic updates
 */
export function useDeleteMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMatter,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters'] });

      // Get current data
      const previousMatters = queryClient.getQueryData(['matters']);
      const previousMatter = previousMatters?.find(m => m.id === deletedId);

      // Optimistically remove matter
      queryClient.setQueryData(
        ['matters'],
        previousMatters?.filter(m => m.id !== deletedId) || []
      );
      queryClient.removeQueries({ queryKey: ['matter', deletedId] });

      return { previousMatters, previousMatter };
    },
    onSuccess: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMatters) {
        queryClient.setQueryData(['matters'], context.previousMatters);
      }
      if (context?.previousMatter) {
        queryClient.setQueryData(['matter', variables.id], context.previousMatter);
      }
    },
  });
}
