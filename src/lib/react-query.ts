import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * TanStack Query Client Configuration
 *
 * Configured with dev tools for development and optimized options for production
 */

/**
 * Create a new QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Number of times to retry a failed request
      retries: 3,

      // Delay between retry attempts
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Time to wait before attempting a retry after failure
      retryDelayMs: 1000,

      // How long data should remain in cache before being garbage collected
      gcTime: 5 * 60 * 1000, // 5 minutes

      // Window of time to refetch when window regains focus
      refetchOnWindowFocus: true,

      // Don't refetch on reconnection when internet connection is restored
      refetchOnReconnect: false,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    queries: {
      // How long data stays fresh
      refetchOnWindowFocus: false,

      // Number of times a query will be refetched when it's stale
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Time to keep stale data in cache
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
    mutations: {
      // Retry mutations once on error
      retry: 1,

      // Retry mutation after this delay
      retryDelayMs: 1000,
    },
  });
}

/**
 * Query Client instance for the application
 */
export const queryClient = createQueryClient();
