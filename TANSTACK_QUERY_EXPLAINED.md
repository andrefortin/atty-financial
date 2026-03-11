# TanStack Query Explained

A comprehensive guide to server state management with TanStack Query.

---

## Table of Contents

1. [What is TanStack Query?](#1-what-is-tanstack-query)
2. [Key Concepts](#2-key-concepts)
3. [Core Features](#3-core-features)
4. [Why Use It?](#4-why-use-it)
5. [Code Examples](#5-code-examples)
6. [TanStack Query + Zustand Hybrid](#6-tanstack-query--zustand-hybrid)
7. [Firestore Integration](#7-firestore-integration)
8. [Pros & Cons](#8-pros--cons)
9. [Quick Start](#9-quick-start)

---

## 1. What is TanStack Query?

### High-Level Definition

**TanStack Query** (formerly React Query) is a powerful data synchronization library for managing server state in React applications. It handles fetching, caching, synchronizing, and updating server data with minimal configuration.

> **Server State**: Data that comes from an external API, database, or any source outside your application.

### What Problems Does It Solve?

**Without TanStack Query:**

```typescript
// ❌ Manual state management - lots of boilerplate
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Need to manually trigger fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Need to manually cache
  // Need to manually refetch
  // Need to handle race conditions
  // Need to handle deduplication

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <UserList data={users} />;
}
```

**With TanStack Query:**

```typescript
// ✅ TanStack Query - minimal boilerplate
function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
  });

  // Automatic caching
  // Automatic refetching
  // No race conditions
  // Request deduplication built-in

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <UserList data={users} />;
}
```

### Problems Solved by TanStack Query

| Problem | Traditional Approach | TanStack Query Solution |
|---------|-------------------|------------------------|
| **Manual state** | `useState`, `useEffect` | Automatic state management |
| **Caching** | Implement your own | Built-in intelligent caching |
| **Stale data** | Manual refetch triggers | Automatic background refetching |
| **Race conditions** | Handle manually | Automatic request cancellation |
| **Duplicate requests** | Multiple fetch calls | Automatic deduplication |
| **Loading states** | Track manually | Built-in loading states |
| **Error handling** | Try/catch everywhere | Centralized error handling |
| **Optimistic UI** | Complex logic | Built-in optimistic updates |
| **Pagination** | Complex state | Built-in pagination support |
| **Real-time sync** | Manual polling or WebSockets | Automatic refetching options |

### Who Should Use TanStack Query?

**✅ Perfect For:**
- Applications with API calls
- CRUD operations (Create, Read, Update, Delete)
- Real-time data requirements
- Complex caching needs
- Optimistic UI updates
- Pagination and infinite scrolling
- Offline-first applications

**❌ Not Needed For:**
- Simple, static content
- Client-only applications (no API)
- Simple local state (forms, UI toggles)
- Very small applications (few API calls)

**⚠️ Consider Carefully:**
- Applications with mostly local state (use Zustand/Context instead)
- Simple one-page apps with minimal data fetching

---

## 2. Key Concepts

### Queries (Fetching Data)

**Query**: A request to fetch data from a server. Queries are read-only operations.

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['users'],              // Unique identifier
  queryFn: fetchUsers,             // Function that returns data
  staleTime: 5 * 60 * 1000,       // Data is fresh for 5 minutes
  cacheTime: 10 * 60 * 1000,      // Keep in cache for 10 minutes
});
```

**Query Lifecycle:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Query Lifecycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fresh State                                           │
│     └─ Data is fresh (within staleTime)                    │
│     └─ No request made                                    │
│                                                             │
│  2. Fetching State                                        │
│     └─ Request is in progress                              │
│     └─ Loading = true                                      │
│                                                             │
│  3. Success State                                         │
│     └─ Data received and cached                           │
│     └─ Loading = false, Data available                     │
│                                                             │
│  4. Stale State                                           │
│     └─ Data is old (past staleTime)                        │
│     └─ May trigger background refetch                      │
│                                                             │
│  5. Error State                                            │
│     └─ Request failed                                      │
│     └─ Error object available                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mutations (Modifying Data)

**Mutation**: An operation that modifies data on the server (Create, Update, Delete).

```typescript
const mutation = useMutation({
  mutationFn: async (userData: UserData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  onSuccess: (data) => {
    // Handle success
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
  onError: (error) => {
    // Handle error
  },
});

// Usage
mutation.mutate({ name: 'John', email: 'john@example.com' });
```

**Mutation Lifecycle:**

```
┌─────────────────────────────────────────────────────────────┐
│                  Mutation Lifecycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Idle State                                            │
│     └─ No mutation in progress                             │
│                                                             │
│  2. Pending State (onMutate)                               │
│     └─ Mutation started                                     │
│     └─ Perfect for optimistic updates                       │
│                                                             │
│  3. Success State (onSuccess)                             │
│     └─ Mutation succeeded                                  │
│     └─ Data returned                                       │
│                                                             │
│  4. Error State (onError)                                  │
│     └─ Mutation failed                                     │
│     └─ Error available                                      │
│                                                             │
│  5. Settled State (onSettled)                             │
│     └─ Always runs after success or error                  │
│     └─ Perfect for cleanup                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Caching

TanStack Query automatically caches query results based on their `queryKey`.

```typescript
// First component: Fetches data
function UserList() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  // Makes network request
}

// Second component: Uses cached data
function UserCount() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  // No network request! Uses cached data.
}

// Both components share the same cache
```

**Cache Configuration:**

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Data is "fresh" for 5 minutes - no refetching
  staleTime: 5 * 60 * 1000,

  // Data stays in cache for 10 minutes
  cacheTime: 10 * 60 * 1000,

  // Refetch when window regains focus
  refetchOnWindowFocus: true,

  // Refetch when component mounts (if stale)
  refetchOnMount: true,

  // Refetch when connection is restored
  refetchOnReconnect: true,

  // Retry failed requests 3 times
  retry: 3,
});
```

**Cache Invalidation:**

```typescript
// After mutating data, invalidate related queries
mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    // Invalidate all user queries
    queryClient.invalidateQueries({ queryKey: ['users'] });

    // Invalidate specific user
    queryClient.invalidateQueries({ queryKey: ['users', userId] });

    // Invalidate multiple queries
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'users';
      },
    });
  },
});
```

### Background Refetching

TanStack Query automatically refetches data in the background to keep it fresh.

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Refetch when window regains focus (default: true)
  refetchOnWindowFocus: true,

  // Refetch when component remounts (default: true)
  refetchOnMount: true,

  // Refetch when network reconnects (default: true)
  refetchOnReconnect: true,

  // Refetch at interval (every 30 seconds)
  refetchInterval: 30 * 1000,

  // Pause refetching when window is hidden
  refetchIntervalInBackground: false,
});
```

**Refetching Triggers:**

```
┌─────────────────────────────────────────────────────────────┐
│                 Refetching Triggers                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Component Mount       ──►  Refetch if stale               │
│  Window Focus         ──►  Refetch if stale               │
│  Network Reconnect   ──►  Refetch if stale               │
│  Interval Timer      ──►  Refetch (regardless)           │
│  Manual Trigger      ──►  Refetch (regardless)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Optimistic Updates

Update UI immediately before server confirmation, rolling back on error.

```typescript
const mutation = useMutation({
  mutationFn: updateUserName,

  // Before mutation starts
  onMutate: async (newName) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users', userId] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['users', userId]);

    // Optimistically update to new value
    queryClient.setQueryData(['users', userId], (old) => ({
      ...old,
      name: newName,
    }));

    // Return context with previous value
    return { previousUser };
  },

  // If mutation fails
  onError: (err, newName, context) => {
    // Rollback to previous value
    queryClient.setQueryData(['users', userId], context.previousUser);
  },

  // Always run (success or error)
  onSettled: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['users', userId] });
  },
});
```

**Optimistic Update Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│              Optimistic Update Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Update"                                  │
│     │                                                        │
│     ▼                                                        │
│  2. onMutate: Cancel refetches                              │
│     │                                                        │
│     ▼                                                        │
│  3. onMutate: Save previous data                             │
│     │                                                        │
│     ▼                                                        │
│  4. onMutate: Update UI optimistically  ✅ UI Updated        │
│     │                                                        │
│     ▼                                                        │
│  5. Send mutation to server                                 │
│     │                                                        │
│     ├─► Success ──► onSettled: Refetch                     │
│     │                                                        │
│     └─► Error ──► onError: Rollback   ❌ UI Reverted       │
│                           │                                │
│                           ▼                                │
│                        onSettled: Refetch                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling

TanStack Query provides multiple ways to handle errors.

```typescript
// 1. Basic error handling
const { data, error, isError } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

if (isError) {
  return <ErrorMessage error={error} />;
}

// 2. Retry configuration
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Retry 3 times on failure
  retry: 3,

  // Retry only on specific status codes
  retry: (failureCount, error) => {
    if (error.status === 404) return false;
    if (failureCount < 3) return true;
    return false;
  },

  // Exponential backoff
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// 3. Global error handling (queryClient)
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error);
      toast.error('Something went wrong');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error('Failed to save changes');
    },
  }),
});
```

---

## 3. Core Features

### Automatic Caching

Every query result is cached automatically based on its `queryKey`.

```typescript
// Component A - fetches data
function UserList() {
  useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}

// Component B - uses cache (no network request)
function UserCount() {
  useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}

// Component C - different query key (new request)
function UserListFiltered() {
  useQuery({ queryKey: ['users', 'active'], queryFn: fetchActiveUsers });
}
```

**Cache Behavior:**

| Action | Behavior |
|--------|----------|
| Same `queryKey` | Returns cached data |
| Different `queryKey` | Makes new request |
| Cache expired | Refetches in background |
| Cache valid | Returns cached data instantly |

### Automatic Refetching

TanStack Query refetches data to keep it fresh automatically.

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Default refetching behavior
  refetchOnMount: true,        // When component mounts
  refetchOnWindowFocus: true,   // When window gains focus
  refetchOnReconnect: true,    // When network reconnects

  // Additional refetching
  refetchInterval: 60 * 1000,  // Every 60 seconds
});
```

**Refetching Scenarios:**

```typescript
// Scenario 1: Multiple components use same data
function App() {
  return (
    <>
      <UserList />      {/* Refetches on mount */}
      <UserCount />     {/* Uses cache */}
      <UserStats />     {/* Uses cache */}
    </>
  );
}

// Scenario 2: Window focus triggers refetch
// User switches tabs and comes back → data refetched

// Scenario 3: Network reconnects
// User goes offline and comes back → data refetched

// Scenario 4: Manual refetch
function UserList() {
  const { refetch } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  return (
    <button onClick={() => refetch()}>
      Refresh
    </button>
  );
}
```

### Parallel Queries

Fetch multiple independent queries simultaneously.

```typescript
// Method 1: Multiple useQuery hooks
function Dashboard() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  // All fetch in parallel
}

// Method 2: useQueries hook
function Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['users'],
        queryFn: fetchUsers,
      },
      {
        queryKey: ['posts'],
        queryFn: fetchPosts,
      },
      {
        queryKey: ['stats'],
        queryFn: fetchStats,
      },
    ],
  });

  const users = results[0].data;
  const posts = results[1].data;
  const stats = results[2].data;

  // All fetch in parallel
}
```

**Parallel vs Sequential:**

```
Parallel Queries (faster):
┌────────────────────────────────────────────┐
│  Users Query    ──┐                      │
│  Posts Query    ──┼──► Complete         │
│  Stats Query   ──┘   (total: 1 second)  │
└────────────────────────────────────────────┘

Sequential Queries (slower):
┌────────────────────────────────────────────┐
│  Users Query   ──► Posts Query ──►     │
│                              Stats       │
│  Query ──► Complete (total: 3 seconds) │
└────────────────────────────────────────────┘
```

### Dependent Queries

Run queries that depend on data from previous queries.

```typescript
// ❌ Bad: Nesting leads to callback hell
function UserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchPosts(userId),
    enabled: !!user,  // Wait for user
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', userId],
    queryFn: () => fetchComments(userId),
    enabled: !!posts,  // Wait for posts
  });
}
```

```typescript
// ✅ Good: Clean dependent queries
function UserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Only runs if user exists
  const { data: posts } = useQuery({
    queryKey: ['user', userId, 'posts'],
    queryFn: () => fetchPosts(userId),
    enabled: !!user,
  });

  // Only runs if posts exist
  const { data: comments } = useQuery({
    queryKey: ['user', userId, 'posts', 'comments'],
    queryFn: () => fetchComments(userId, posts?.length),
    enabled: !!posts,
  });
}
```

**Dependent Query Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                Dependent Query Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fetch User                                            │
│     │                                                        │
│     ├─► Success ──► Enable Posts Query                     │
│     │                   │                                  │
│     │                   ├─► Success ──► Enable Comments    │
│     │                   │              Query                │
│     │                   │                   │               │
│     │                   │                   └─► Success      │
│     │                   │                                   │
│     └─► Error ──► Don't enable Posts Query                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pagination

Built-in support for paginated data.

```typescript
function UserList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),

    // Keep previous data while fetching next page
    keepPreviousData: true,
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      <button
        onClick={() => setPage((p) => p - 1)}
        disabled={page === 1 || isLoading}
      >
        Previous
      </button>

      <span>Page {page} of {totalPages}</span>

      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={page === totalPages || isLoading}
      >
        {isPreviousData ? 'Loading...' : 'Next'}
      </button>
    </div>
  );
}
```

**Pagination with useInfiniteQuery:**

```typescript
function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchUsers(pageParam),

    // Function to get next page param
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // No more pages
    },
  });

  const allUsers = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <>
      <ul>
        {allUsers.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </>
  );
}
```

### Infinite Loading

Load data progressively as user scrolls.

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteScrollList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts(pageParam),

    // Determine if there's a next page
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.nextCursor;
      }
      return undefined;
    },
  });

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <div ref={loadMoreRef} style={{ height: 100 }}>
          {isFetchingNextPage ? 'Loading...' : 'Scroll for more'}
        </div>
      )}
    </div>
  );
}
```

**Infinite Loading Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│              Infinite Loading Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Initial Load                                               │
│     │                                                        │
│     ▼                                                        │
│  Fetch Page 1 ──► Display                                  │
│     │                                                        │
│     ▼                                                        │
│  User Scrolls to Bottom                                     │
│     │                                                        │
│     ▼                                                        │
│  Fetch Page 2 ──► Append to Page 1                        │
│     │                                                        │
│     ▼                                                        │
│  User Scrolls More                                          │
│     │                                                        │
│     ▼                                                        │
│  Fetch Page 3 ──► Append to Previous                        │
│     │                                                        │
│     ▼                                                        │
│  Continue Until No More Pages                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DevTools

Visual debugging tool for TanStack Query.

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**DevTools Features:**

- 🔍 Inspect all queries and mutations
- 📊 View cache state
- ⚡ Manually refetch or invalidate
- 🗑️ Clear cache
- 📈 Monitor query times
- 🎨 Dark/light theme

---

## 4. Why Use It?

### Problems Solved

#### 1. Manual State Management

**Without TanStack Query:**
```typescript
// Need to track loading, error, data manually
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Complex fetch logic
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Need to handle cleanup
  useEffect(() => {
    return () => {
      // Cancel in-flight requests
    };
  }, []);

  // ... render logic
}
```

**With TanStack Query:**
```typescript
// Automatic state management
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error />;

  return <List data={data} />;
}
```

#### 2. Caching Complexity

**Without TanStack Query:**
```typescript
// Need to implement caching manually
const cache = new Map();

async function fetchUsersWithCache() {
  if (cache.has('users')) {
    return cache.get('users');
  }

  const data = await fetch('/api/users').then((r) => r.json());
  cache.set('users', data);

  // Need to handle cache invalidation
  // Need to handle cache expiration
  // Need to handle cache size limits

  return data;
}
```

**With TanStack Query:**
```typescript
// Automatic caching with smart defaults
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Cache for 5 minutes
  staleTime: 5 * 60 * 1000,

  // Keep in cache for 10 minutes
  cacheTime: 10 * 60 * 1000,
});
```

#### 3. Stale Data

**Without TanStack Query:**
```typescript
// Data gets stale, no auto-refresh
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);  // Only fetches once

  // User needs to manually refresh
  // Data could be stale for hours
}
```

**With TanStack Query:**
```typescript
// Auto-refreshes to keep data fresh
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Refetch when window focuses
  refetchOnWindowFocus: true,

  // Refetch every minute
  refetchInterval: 60 * 1000,

  // Refetch on reconnect
  refetchOnReconnect: true,
});
```

#### 4. Race Conditions

**Without TanStack Query:**
```typescript
// Race condition: user clicks fast
function UserList() {
  const [user, setUser] = useState(null);

  const loadUser = async (id) => {
    const data = await fetchUser(id);
    setUser(data);  // Which request finishes first?
  };

  return (
    <>
      <button onClick={() => loadUser(1)}>User 1</button>
      <button onClick={() => loadUser(2)}>User 2</button>
      {/* Race condition possible */}
    </>
  );
}
```

**With TanStack Query:**
```typescript
// Automatic cancellation, no race conditions
function UserList() {
  const [userId, setUserId] = useState(1);

  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),

    // Cancels previous request
    enabled: !!userId,
  });

  return <User user={data} />;
}
```

### Comparison: Manual Fetch vs TanStack Query

| Feature | Manual Fetch | TanStack Query |
|---------|--------------|----------------|
| **Lines of Code** | 50-100 | 5-10 |
| **Caching** | Manual | Automatic |
| **Loading States** | Manual | Built-in |
| **Error Handling** | Try/catch everywhere | Centralized |
| **Race Conditions** | Possible | Handled automatically |
| **Refetching** | Manual | Automatic |
| **Deduplication** | Manual | Built-in |
| **Optimistic UI** | Complex | Built-in |
| **Pagination** | Complex | Built-in |
| **DevTools** | None | Excellent |

### When to Use TanStack Query

| Scenario | Use TanStack Query? | Reason |
|----------|---------------------|--------|
| **REST API calls** | ✅ Yes | Perfect for fetching |
| **GraphQL** | ✅ Yes | Works great with GraphQL |
| **CRUD operations** | ✅ Yes | Built-in mutations |
| **Real-time data** | ✅ Yes | Auto-refetch |
| **Pagination** | ✅ Yes | Built-in support |
| **Optimistic UI** | ✅ Yes | Built-in support |
| **Simple local state** | ❌ No | Use Zustand/Context |
| **Client-only forms** | ❌ No | Use Zustand/Context |
| **One-time fetch** | ⚠️ Maybe | Overkill if simple |
| **Static content** | ❌ No | No server state |

---

## 5. Code Examples

### Basic Query Example

```typescript
import { useQuery } from '@tanstack/react-query';

// Define fetch function
async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

// Component using query
function UserList() {
  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,

    // Options
    staleTime: 5 * 60 * 1000,      // 5 minutes
    cacheTime: 10 * 60 * 1000,     // 10 minutes
    retry: 3,                       // Retry 3 times
  });

  // Loading state
  if (isLoading) {
    return <div>Loading users...</div>;
  }

  // Error state
  if (isError) {
    return (
      <div>
        <p>Error: {(error as Error).message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // Success state
  return (
    <div>
      <h2>Users ({users.length})</h2>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Mutation Example

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUserForm() {
  const queryClient = useQueryClient();

  // Create mutation
  const mutation = useMutation({
    mutationFn: async (userData: UserData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      return response.json();
    },

    // On success
    onSuccess: (newUser) => {
      toast.success('User created successfully');

      // Invalidate users query to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },

    // On error
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },

    // Always run (success or error)
    onSettled: () => {
      // Cleanup, reset form, etc.
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };

    mutation.mutate(userData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />

      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Creating...' : 'Create User'}
      </button>

      {mutation.isError && (
        <div className="error">
          {(mutation.error as Error).message}
        </div>
      )}
    </form>
  );
}
```

### Optimistic Update Example

```typescript
function LikeButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      return response.json();
    },

    // Before mutation - optimistic update
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts', postId] });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(['posts', postId]);

      // Optimistically update
      queryClient.setQueryData<Post>(['posts', postId], (old) => ({
        ...old!,
        likes: old!.likes + 1,
        liked: true,
      }));

      // Return context for rollback
      return { previousPost };
    },

    // If mutation fails - rollback
    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(
          ['posts', postId],
          context.previousPost
        );
      }
    },

    // Always - refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });

  const { data: post } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isLoading}
    >
      {post?.liked ? '❤️' : '🤍'} {post?.likes}
    </button>
  );
}
```

**Optimistic Update Timeline:**

```
User clicks like button
         │
         ▼
    onMutate starts
         │
         ├─► Cancel outgoing refetches
         │
         ├─► Save previous data (likes: 42, liked: false)
         │
         └─► Update cache optimistically (likes: 43, liked: true)
                    │
                    ▼
              UI shows 43 likes ❤️ (instant!)
                    │
                    ├─► Success: Refetch, confirm 43 likes
                    │
                    └─► Error: Rollback to 42 likes 🤍
```

### Pagination Example

```typescript
function PaginatedUserList() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () =>
      fetchUsers({
        page,
        pageSize,
      }),

    // Keep previous data while fetching next page
    keepPreviousData: true,
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div>
      {/* User list */}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      {/* Pagination controls */}
      <div className="pagination">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1 || isLoading}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages} ({total} total)
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page === totalPages || isLoading}
        >
          {isPreviousData ? 'Loading...' : 'Next'}
        </button>
      </div>

      {/* Page info */}
      <div className="page-info">
        Showing {(page - 1) * pageSize + 1}-
        {Math.min(page * pageSize, total)} of {total}
      </div>
    </div>
  );
}

// Fetch function
async function fetchUsers({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const response = await fetch(
    `/api/users?page=${page}&pageSize=${pageSize}`
  );
  return response.json();
}
```

### Error Handling Example

```typescript
// 1. Component-level error handling
function UserProfile({ userId }: { userId: string }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),

    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (user not found)
      if (error?.status === 404) return false;

      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) return false;

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Exponential backoff
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorDisplay error={error} onRetry={refetch} />;

  return <UserProfileCard user={user} />;
}

// 2. Global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log all query errors
      console.error('Query error:', error);

      // Show toast for specific queries
      if (query.queryKey[0] === 'users') {
        toast.error('Failed to load users');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context) => {
      // Log all mutation errors
      console.error('Mutation error:', error);

      // Show toast
      toast.error('Failed to save changes');
    },
  }),
});

// 3. Error boundary integration
function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Use error boundary for errors
        useErrorBoundary: true,
      },
    },
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## 6. TanStack Query + Zustand Hybrid

### How They Complement Each Other

| Concern | Zustand | TanStack Query |
|---------|----------|----------------|
| **UI State** | ✅ Perfect | ❌ Not suited |
| **Forms** | ✅ Perfect | ❌ Not suited |
| **Modals** | ✅ Perfect | ❌ Not suited |
| **Theme** | ✅ Perfect | ❌ Not suited |
| **Server Data** | ⚠️ Possible | ✅ Perfect |
| **API Caching** | ❌ Manual | ✅ Built-in |
| **Optimistic UI** | ❌ Complex | ✅ Built-in |
| **Pagination** | ⚠️ Manual | ✅ Built-in |

### What State Belongs Where

**Zustand (Client State):**
- Form inputs and validation
- Modal open/close states
- Toast notifications
- Sidebar toggle state
- Dark/light theme
- Filter values (but NOT filtered results)
- Sort order (but NOT sorted results)
- Current page number (but NOT paginated data)
- User preferences

**TanStack Query (Server State):**
- API data (users, posts, etc.)
- Cached responses
- Optimistically updated data
- Paginated results
- Filtered and sorted server results
- Real-time data subscriptions

### Integration Pattern

```typescript
// Zustand: UI state (filters, sorting)
const useUIStore = create((set) => ({
  // Filter values
  filters: {
    status: 'all',
    searchQuery: '',
    dateRange: null,
  },

  // Sorting
  sorting: {
    field: 'createdAt',
    direction: 'desc',
  },

  // Pagination
  pagination: {
    page: 1,
    pageSize: 10,
  },

  // Actions
  setFilters: (filters) => set({ filters }),
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
  resetFilters: () => set({ filters: initialFilters }),
}));

// TanStack Query: Server data
function UserList() {
  // Get UI state from Zustand
  const { filters, sorting, pagination } = useUIStore((state) => ({
    filters: state.filters,
    sorting: state.sorting,
    pagination: state.pagination,
  }));

  // Get actions from Zustand
  const setFilters = useUIStore((state) => state.setFilters);
  const setPagination = useUIStore((state) => state.setPagination);

  // Fetch server data with TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', filters, sorting, pagination],
    queryFn: () =>
      fetchUsers({
        filters,
        sorting,
        pagination,
      }),

    // Keep previous data while filtering
    keepPreviousData: true,
  });

  return (
    <div>
      {/* Filter controls update Zustand */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
      />

      {/* Sort controls update Zustand */}
      <SortControl
        sorting={sorting}
        onChange={setSorting}
      />

      {/* Display data from TanStack Query */}
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <UserTable users={data?.users ?? []} />

          {/* Pagination controls update Zustand */}
          <Pagination
            current={pagination.page}
            total={data?.totalPages ?? 1}
            onChange={(page) =>
              setPagination({ ...pagination, page })
            }
          />
        </>
      )}
    </div>
  );
}
```

### Complete Hybrid Example

```typescript
// ====== ZUSTAND STORE: UI STATE ======
import { create } from 'zustand';

interface UIState {
  // Filters
  filters: {
    status: 'all' | 'active' | 'inactive';
    searchQuery: string;
  };

  // Sorting
  sorting: {
    field: 'name' | 'createdAt';
    direction: 'asc' | 'desc';
  };

  // Pagination
  pagination: {
    page: number;
    pageSize: number;
  };

  // Modal state
  modals: {
    createUser: boolean;
    editUser: boolean;
    selectedUserId: string | null;
  };

  // Toast state
  toasts: Toast[];

  // Actions
  setFilters: (filters: Partial<UIState['filters']>) => void;
  setSorting: (sorting: UIState['sorting']) => void;
  setPagination: (pagination: Partial<UIState['pagination']>) => void;
  openModal: (modal: keyof UIState['modals'], data?: any) => void;
  closeModal: () => void;
  showToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  filters: {
    status: 'all',
    searchQuery: '',
  },

  sorting: {
    field: 'createdAt',
    direction: 'desc',
  },

  pagination: {
    page: 1,
    pageSize: 10,
  },

  modals: {
    createUser: false,
    editUser: false,
    selectedUserId: null,
  },

  toasts: [],

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1
    })),

  setSorting: (sorting) => set({ sorting }),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  openModal: (modal, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: true,
        selectedUserId: data?.userId || null,
      },
    })),

  closeModal: () =>
    set((state) => ({
      modals: {
        createUser: false,
        editUser: false,
        selectedUserId: null,
      },
    })),

  showToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        },
      ],
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// ====== TANSTACK QUERY: SERVER DATA ======
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query hooks
export function useUsers() {
  const { filters, sorting, pagination } = useUIStore((state) => ({
    filters: state.filters,
    sorting: state.sorting,
    pagination: state.pagination,
  }));

  return useQuery({
    queryKey: ['users', filters, sorting, pagination],
    queryFn: () =>
      api.users.list({
        filters,
        sorting,
        pagination,
      }),
    keepPreviousData: true,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.users.get(userId),
    enabled: !!userId,
  });
}

// Mutation hooks
export function useCreateUser() {
  const queryClient = useQueryClient();
  const closeModal = useUIStore((state) => state.closeModal);
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: api.users.create,
    onSuccess: () => {
      // Invalidate users query
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Update UI state
      closeModal();
      showToast({
        type: 'success',
        message: 'User created successfully',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: `Failed to create user: ${error.message}`,
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const closeModal = useUIStore((state) => state.closeModal);
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      api.users.update(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user and users queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      // Update UI state
      closeModal();
      showToast({
        type: 'success',
        message: 'User updated successfully',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: `Failed to update user: ${error.message}`,
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({
        type: 'success',
        message: 'User deleted successfully',
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        message: `Failed to delete user: ${error.message}`,
      });
    },
  });
}

// ====== COMPONENT: USING BOTH ======
function UserList() {
  // TanStack Query: Server data
  const { data, isLoading, error } = useUsers();

  // Zustand: UI state
  const { filters, sorting, pagination } = useUIStore((state) => ({
    filters: state.filters,
    sorting: state.sorting,
    pagination: state.pagination,
  }));

  // Zustand: Actions
  const setFilters = useUIStore((state) => state.setFilters);
  const setSorting = useUIStore((state) => state.setSorting);
  const setPagination = useUIStore((state) => state.setPagination);
  const openModal = useUIStore((state) => state.openModal);

  // Mutation
  const deleteUser = useDeleteUser();

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>Users</h1>
        <button onClick={() => openModal('createUser')}>
          Add User
        </button>
      </div>

      {/* Filters - Updates Zustand */}
      <FilterBar
        searchQuery={filters.searchQuery}
        status={filters.status}
        onFilterChange={setFilters}
      />

      {/* Sorting - Updates Zustand */}
      <SortControl
        field={sorting.field}
        direction={sorting.direction}
        onSortChange={setSorting}
      />

      {/* Data from TanStack Query */}
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : (
        <>
          <UserTable
            users={data?.users ?? []}
            onDelete={handleDelete}
          />

          {/* Pagination - Updates Zustand */}
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={data?.totalPages ?? 1}
            onPageChange={(page) =>
              setPagination({ page })
            }
          />
        </>
      )}

      {/* Modals - Zustand state */}
      {useUIStore((state) => state.modals.createUser) && (
        <CreateUserModal onClose={useUIStore.getState().closeModal} />
      )}

      {useUIStore((state) => state.modals.editUser) && (
        <EditUserModal
          userId={useUIStore((state) => state.modals.selectedUserId)!}
          onClose={useUIStore.getState().closeModal}
        />
      )}

      {/* Toasts - Zustand state */}
      <Toasts />
    </div>
  );
}
```

---

## 7. Firestore Integration

### How to Use with Firebase/Firestore

TanStack Query works excellently with Firestore queries.

```typescript
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

// Query helpers
async function fetchUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function fetchUser(userId: string) {
  const docRef = doc(db, 'users', userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('User not found');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

async function fetchFilteredUsers(filters: UserFilters) {
  let q = collection(db, 'users');

  if (filters.status !== 'all') {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters.searchQuery) {
    q = query(
      q,
      where('name', '>=', filters.searchQuery),
      where('name', '<=', filters.searchQuery + '\uf8ff')
    );
  }

  q = query(q, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Mutation helpers
async function createUser(userData: UserData) {
  const docRef = await addDoc(collection(db, 'users'), userData);
  return { id: docRef.id, ...userData };
}

async function updateUser(userId: string, userData: Partial<UserData>) {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, userData);
  return { id: userId, ...userData };
}

async function deleteUser(userId: string) {
  const docRef = doc(db, 'users', userId);
  await deleteDoc(docRef);
  return userId;
}

// Query hooks
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });
}

export function useFilteredUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', 'filtered', filters],
    queryFn: () => fetchFilteredUsers(filters),
  });
}

// Mutation hooks
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      updateUser(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Real-Time Subscriptions

Firestore has built-in real-time support. TanStack Query can work with this using a custom hook.

```typescript
import { useEffect, useState } from 'react';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

// Real-time query hook
function useFirestoreRealtimeQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial fetch
    queryFn().then((data) => {
      queryClient.setQueryData(queryKey, data);
    });

    // Setup real-time listener
    const unsubscribe = onSnapshot(queryFn(), (snapshot) => {
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update cache with real-time data
      queryClient.setQueryData(queryKey, data);
    });

    // Cleanup
    return () => unsubscribe();
  }, [queryKey, queryFn, queryClient]);

  // Return standard query state
  return useQuery({
    queryKey,
    queryFn,
    enabled: false, // Don't refetch, real-time handles it
  });
}

// Usage
export function useUsersRealtime() {
  return useFirestoreRealtimeQuery(
    ['users'],
    () => getDocs(collection(db, 'users'))
  );
}

export function useUserRealtime(userId: string) {
  return useFirestoreRealtimeQuery(
    ['user', userId],
    () => getDoc(doc(db, 'users', userId))
  );
}

// Component usage
function UserList() {
  const { data: users } = useUsersRealtime();

  // Data updates automatically when Firestore changes!

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Optimistic Updates with Firestore

```typescript
export function useLikePost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1),
        liked: true,
      });
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousPost = queryClient.getQueryData<Post>(['post', postId]);

      queryClient.setQueryData<Post>(['post', postId], (old) => ({
        ...old!,
        likes: old!.likes + 1,
        liked: true,
      }));

      return { previousPost };
    },

    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
```

---

## 8. Pros & Cons

### Advantages

| Advantage | Description |
|-----------|-------------|
| **Less Boilerplate** | 5-10 lines vs 50-100 lines for manual fetching |
| **Automatic Caching** | No need to implement your own cache |
| **Smart Defaults** | Works great out of the box |
| **Automatic Refetching** | Data stays fresh automatically |
| **Request Deduplication** | No duplicate requests |
| **Optimistic UI** | Easy optimistic updates |
| **Pagination Support** | Built-in pagination and infinite scroll |
| **DevTools** | Excellent debugging experience |
| **TypeScript Support** | Excellent type inference |
| **Flexible** | Works with REST, GraphQL, Firebase, etc. |
| **Framework Agnostic** | Works with React, Vue, Svelte, Solid |
| **Battle-Tested** | Used by thousands of companies |

### Disadvantages

| Disadvantage | Description |
|--------------|-------------|
| **Bundle Size** | ~13KB minzipped (adds to bundle) |
| **Learning Curve** | New concepts to learn (queries, mutations, keys) |
| **Overkill for Simple Apps** | Too much for minimal API usage |
| **Client State Confusion** | Can be confused about what goes where |
| **Cache Management** | Advanced caching strategies can be complex |
| **Debugging Complexity** | Sometimes hard to trace cache behavior |
| **Initial Setup** | Need QueryClientProvider wrapper |

### When It's Overkill

Consider **not** using TanStack Query if:

```typescript
// ❌ Overkill scenarios

// 1. Simple one-time fetch
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setUser);
  }, [userId]);

  return user ? <div>{user.name}</div> : <Loading />;
}
// Just use useState + useEffect

// 2. Very few API calls (< 3-4)
function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats);
  }, []);

  return stats ? <StatsCard data={stats} /> : null;
}
// TanStack Query adds unnecessary complexity

// 3. Client-only state (no API)
function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  );
}
// Use Zustand or Context instead
```

```typescript
// ✅ Perfect for TanStack Query

// 1. Multiple API calls with caching
function Dashboard() {
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const posts = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  // All cached, refetched automatically
}

// 2. CRUD operations
function UserList() {
  const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const create = useMutation({ mutationFn: createUser });
  const update = useMutation({ mutationFn: updateUser });
  const delete = useMutation({ mutationFn: deleteUser });

  // Optimistic updates, automatic invalidation
}

// 3. Pagination
function UserList() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
    keepPreviousData: true,
  });

  // Built-in pagination support
}

// 4. Real-time data
function UserList() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });

  // Auto-refreshing data
}
```

---

## 9. Quick Start

### Installation

```bash
# Install TanStack Query
npm install @tanstack/react-query

# Install DevTools (optional but recommended)
npm install @tanstack/react-query-devtools

# Or with yarn
yarn add @tanstack/react-query @tanstack/react-query-devtools

# Or with pnpm
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### Basic Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
  },
});
```

```typescript
// src/main.tsx (or App.tsx)
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import App from './App';

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Root;
```

### First Query

```typescript
// src/api/users.ts
export async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

// src/components/UserList.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/users';

function UserList() {
  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default UserList;
```

### First Mutation

```typescript
// src/api/users.ts
export async function createUser(userData: UserData): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}

// src/components/CreateUserForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '../api/users';

function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate users query to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Reset form
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Creating...' : 'Create User'}
      </button>

      {mutation.isError && (
        <div className="error">
          {(mutation.error as Error).message}
        </div>
      )}
    </form>
  );
}

export default CreateUserForm;
```

### TypeScript Setup

```typescript
// src/types/api.ts
export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  status?: 'active' | 'inactive';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import type { User, PaginatedResponse } from '../types/api';

export function useUsers() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
  });
}
```

### Common Patterns

**1. Fetch with Parameters:**

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, // Only fetch if userId exists
  });

  return <div>{data?.name}</div>;
}
```

**2. Dependent Queries:**

```typescript
function UserPosts({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ['user', userId, 'posts'],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!user, // Only fetch if user exists
  });

  return <div>{posts?.map(p => p.title)}</div>;
}
```

**3. Parallel Queries:**

```typescript
function Dashboard() {
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const posts = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  if (users.isLoading || posts.isLoading || stats.isLoading) {
    return <Loading />;
  }

  return (
    <>
      <UserCount count={users.data?.length ?? 0} />
      <PostCount count={posts.data?.length ?? 0} />
      <StatsCard data={stats.data} />
    </>
  );
}
```

---

## Summary

TanStack Query is a powerful library for managing server state in React applications. It eliminates the boilerplate and complexity of manual data fetching, providing automatic caching, refetching, and state management out of the box.

**Key Takeaways:**

- ✅ Use for **server state** (API calls, database queries)
- ✅ Use Zustand for **client state** (forms, modals, UI state)
- ✅ Combines perfectly with other state management solutions
- ✅ Built-in caching, refetching, and optimistic updates
- ✅ Excellent TypeScript support and DevTools
- ⚠️ May be overkill for very simple applications
- ⚠️ Adds ~13KB to bundle size

**Resources:**

- [Official Documentation](https://tanstack.com/query/latest)
- [GitHub Repository](https://github.com/TanStack/query)
- [DevTools](https://tanstack.com/query/latest/devtools)
- [Examples](https://tanstack.com/query/latest/examples/react/simple)

---

**Document Version:** 1.0
**Last Updated:** March 2026
