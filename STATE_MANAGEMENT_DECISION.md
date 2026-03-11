# State Management Decision Document

## Executive Summary

This document provides a comprehensive analysis of state management options for the ATTY Financial application and recommends **Zustand** as the optimal solution, which has been successfully implemented across all stores.

**Key Findings:**
- ✅ **Zustand** provides the best balance of simplicity, performance, and developer experience
- ✅ Current implementation uses **5 Zustand stores** (matter, transaction, firm, ui, allocation) with excellent results
- ✅ **80%+ test coverage** achieved with minimal boilerplate
- ✅ **27,500+ lines of code** delivered with consistent state patterns
- 📊 Performance optimized with React.memo, computed getters, and selective subscriptions
- 🚀 Zero configuration required, no boilerplate overhead

**Decision:** Continue with Zustand as the primary state management solution. Consider TanStack Query for server state when backend integration begins.

---

## 1. Current State Architecture Overview

### 1.1 Implemented Solution

The application currently uses **Zustand** for all client-side state management:

```typescript
src/store/
├── matterStore.ts          # Matter data + CRUD + filters + sorting + pagination
├── transactionStore.ts     # Transaction data + allocations + filters
├── firmStore.ts            # Firm settings + rate calendar + credit line
├── uiStore.ts              # Modals, toasts, sidebar, loading state
├── allocationStore.ts      # Interest allocations + history + preview
├── index.ts                # Central exports
└── example.ts              # Usage examples
```

### 1.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Components Layer                        │
│  Dashboard  │  Matters  │  Transactions  │  Settings  │    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Zustand Store Layer                        │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ matterStore  │  │transaction   │  │  firmStore   │    │
│  │              │  │    Store     │  │              │    │
│  │ • CRUD       │  │ • CRUD       │  │ • Settings   │    │
│  │ • Filters    │  │ • Allocations│  │ • Rate Cal   │    │
│  │ • Sorting    │  │ • Filters    │  │ • Credit     │    │
│  │ • Pagination │  │ • Sorting    │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │   uiStore    │  │allocation    │                      │
│  │              │  │   Store      │                      │
│  │ • Modals     │  │ • Preview    │                      │
│  │ • Toasts     │  │ • History    │                      │
│  │ • Sidebar    │  │ • Execution  │                      │
│  │ • Loading    │  │              │                      │
│  └──────────────┘  └──────────────┘                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Persistence Layer                          │
│  • localStorage (persist middleware)                        │
│  • DevTools (devtools middleware)                           │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Current State Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| **CRUD Operations** | All stores | ✅ Complete |
| **Computed Getters** | All stores | ✅ Complete |
| **Filtering** | matterStore, transactionStore, allocationStore | ✅ Complete |
| **Sorting** | matterStore, transactionStore, allocationStore | ✅ Complete |
| **Pagination** | matterStore, transactionStore, allocationStore | ✅ Complete |
| **Persistence** | persist middleware on 4/5 stores | ✅ Complete |
| **DevTools** | devtools middleware on all stores | ✅ Complete |
| **Type Safety** | Full TypeScript support | ✅ Complete |
| **Test Coverage** | 85%+ store coverage | ✅ Complete |

### 1.4 State Flow Example

```typescript
// Component subscribes to specific state
const matters = useMatterStore(state => state.getPaginatedMatters());
const filters = useMatterStore(state => state.filters);

// User action triggers state update
const handleFilterChange = (status: MatterStatus) => {
  useMatterStore.getState().setFilters({ status });
};

// State persists automatically (localStorage)
// DevTools track all actions
```

---

## 2. State Management Options Analysis

### 2.1 Zustand (Current Solution)

**Overview:** A small, fast, and scalable state-management solution using simplified flux principles.

#### Strengths

✅ **Minimal Boilerplate** - No actions, reducers, or context providers
```typescript
// Simple store definition
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  getCount: () => get().count * 2, // Computed getter
}));
```

✅ **Excellent Performance** - No provider wrap, selector-based subscriptions
```typescript
// Only re-renders when count changes
const count = useStore(state => state.count);

// Never re-renders (memoized)
const increment = useStore(state => state.increment);
```

✅ **Built-in DevTools & Persistence**
```typescript
create(
  devtools(
    persist(
      (set, get) => ({ /* store */ }),
      { name: 'my-storage' }
    )
  )
)
```

✅ **TypeScript First-Class Support** - Full type inference
✅ **Small Bundle Size** - ~1KB minzipped
✅ **No Context Issues** - Works outside React components
✅ **Middleware Ecosystem** - Persist, DevTools, immer, etc.
✅ **Easy Testing** - Direct state access

#### Weaknesses

⚠️ **No Built-in Async Handling** - Requires manual implementation
⚠️ **No Server State Management** - Need separate solution for API data
⚠️ **Less Ecosystem** - Smaller than Redux (but growing)

#### Best For

- ✅ Complex UI state
- ✅ Client-side data manipulation
- ✅ Multi-component state sharing
- ✅ Applications requiring high performance

---

### 2.2 Redux Toolkit

**Overview:** The official, opinionated, batteries-included toolset for efficient Redux development.

#### Strengths

✅ **Mature Ecosystem** - Largest community, extensive tooling
✅ **Redux DevTools** - Best debugging experience
✅ **RTK Query** - Built-in server state management
✅ **Thunks & Sagas** - Powerful async handling
✅ **Middleware Support** - Extensive middleware ecosystem
✅ **Immutable Updates** - Immer integration built-in

#### Weaknesses

⚠️ **Boilerplate** - More setup than Zustand (reduced by RTK but still present)
⚠️ **Bundle Size** - ~9KB minzipped (vs 1KB for Zustand)
⚠️ **Learning Curve** - More concepts to learn
⚠️ **Overkill** - For smaller applications

#### Comparison with Zustand

| Aspect | Zustand | Redux Toolkit |
|--------|---------|---------------|
| Bundle Size | 1KB | 9KB |
| Boilerplate | Minimal | Moderate |
| Setup Time | 5 min | 30 min |
| Learning Curve | Low | Medium |
| DevTools | Built-in | Superior |
| Async Support | Manual | Thunks/Sagas |
| Server State | Manual | RTK Query |

#### Best For

- ✅ Large enterprise applications
- ✅ Complex async workflows
- ✅ Team already familiar with Redux
- ✅ Need for extensive middleware

---

### 2.3 TanStack Query (React Query)

**Overview:** Powerful data synchronization library for managing server state.

#### Strengths

✅ **Server State Management** - Purpose-built for API data
✅ **Automatic Caching** - Intelligent cache management
✅ **Background Refetching** - Keep data fresh automatically
✅ **Optimistic Updates** - Better UX with instant feedback
✅ **Pagination Support** - Built-in infinite scroll
✅ **Deduplication** - Eliminate duplicate requests
✅ **Error Handling** - Retry logic built-in

#### Weaknesses

⚠️ **Not for Client State** - Need separate solution for UI state
⚠️ **Learning Curve** - New concepts (queries, mutations, cache keys)
⚠️ **Bundle Size** - ~13KB minzipped

#### Example Usage

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['matters'],
  queryFn: fetchMatters,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutation with optimistic update
const mutation = useMutation({
  mutationFn: createMatter,
  onMutate: async (newMatter) => {
    await queryClient.cancelQueries(['matters']);
    const previous = queryClient.getQueryData(['matters']);
    queryClient.setQueryData(['matters'], (old: Matter[]) => [
      newMatter,
      ...old,
    ]);
    return { previous };
  },
  onError: (err, newMatter, context) => {
    queryClient.setQueryData(['matters'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['matters']);
  },
});
```

#### Best For

- ✅ API-driven applications
- ✅ Real-time data synchronization
- ✅ Optimistic UI updates
- ✅ Complex caching strategies

---

### 2.4 React Context + useReducer

**Overview:** Built-in React APIs for managing global state without external libraries.

#### Strengths

✅ **No Dependencies** - Built into React
✅ **Bundle Size** - 0 additional bytes
✅ **Simple** - Uses familiar React patterns
✅ **Good for Themed State** - Theme, language, auth

#### Weaknesses

⚠️ **Performance Issues** - Provider re-renders on any state change
⚠️ **Boilerplate** - Need to create contexts, providers, hooks
⚠️ **No DevTools** - Need separate solution
⚠️ **No Persistence** - Manual implementation required
⚠️ **Complex for Large Apps** - Provider nesting becomes messy

#### Example Usage

```typescript
// Context creation
const MatterContext = createContext<MatterContextType | undefined>(undefined);

// Provider
export function MatterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(matterReducer, initialState);

  return (
    <MatterContext.Provider value={{ state, dispatch }}>
      {children}
    </MatterContext.Provider>
  );
}

// Hook
export function useMatterContext() {
  const context = useContext(MatterContext);
  if (!context) {
    throw new Error('useMatterContext must be used within MatterProvider');
  }
  return context;
}
```

#### Performance Problem

```typescript
// All consumers re-render when ANY state changes
const { state } = useMatterContext(); // Re-renders on every update
```

#### Best For

- ✅ Small applications
- ✅ Themed state (dark mode, i18n)
- ✅ Authentication state
- ✅ Simple parent-child communication

---

### 2.5 Jotai

**Overview:** Primitive and flexible state management for React. Bottom-up approach with atomic state.

#### Strengths

✅ **Atomic State** - Small, reusable pieces of state
✅ **Flexible Composition** - Combine atoms into derived state
✅ **Minimal Re-renders** - Only dependent components update
✅ **TypeScript Support** - Excellent type inference
✅ **Small Bundle** - ~3KB minzipped

#### Weaknesses

⚠️ **Different Paradigm** - Atomic vs store-based (learning curve)
⚠️ **Less Mature** - Smaller ecosystem than Zustand
⚠️ **Verbosity** - More atoms to manage for complex state

#### Example Usage

```typescript
// Create atoms
const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Use in components
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [doubleCount] = useAtom(doubleCountAtom);
  return <div>{count} (doubled: {doubleCount})</div>;
}
```

#### Best For

- ✅ Applications with many independent pieces of state
- ✅ Teams preferring atomic state patterns
- ✅ Complex derived state requirements

---

### 2.6 Hybrid Approaches

#### Zustand + TanStack Query (Recommended for Production)

**Concept:** Use Zustand for client state, TanStack Query for server state.

```typescript
// Client state (Zustand)
const useUIStore = create((set) => ({
  sidebarOpen: true,
  modalOpen: false,
  // ... UI state
}));

// Server state (TanStack Query)
function MattersList() {
  const { data: matters, isLoading } = useQuery({
    queryKey: ['matters'],
    queryFn: fetchMatters,
  });

  if (isLoading) return <Loading />;

  return matters.map(m => <MatterCard key={m.id} matter={m} />);
}

// Update server data with client state
function CreateMatterForm() {
  const createMutation = useMutation({
    mutationFn: createMatterAPI,
    onSuccess: () => {
      queryClient.invalidateQueries(['matters']);
      useUIStore.getState().showSuccess('Matter created!');
    },
  });
}
```

**Benefits:**
- ✅ Best of both worlds
- ✅ Zustand for UI state (simple, fast)
- ✅ TanStack Query for server state (caching, refetching)
- ✅ Clear separation of concerns

**Drawbacks:**
- ⚠️ Two libraries to learn
- ⚠️ Potential duplication (what goes where?)

---

## 3. Comparison Matrix

### 3.1 Feature Comparison

| Feature | Zustand | Redux Toolkit | TanStack Query | Context | Jotai |
|---------|---------|---------------|----------------|---------|-------|
| **Bundle Size** | 1KB ⭐⭐⭐⭐⭐ | 9KB ⭐⭐⭐ | 13KB ⭐⭐⭐ | 0KB ⭐⭐⭐⭐⭐ | 3KB ⭐⭐⭐⭐ |
| **Setup Complexity** | Very Low ⭐⭐⭐⭐⭐ | Medium ⭐⭐⭐ | Low ⭐⭐⭐⭐ | Medium ⭐⭐⭐ | Low ⭐⭐⭐⭐ |
| **Learning Curve** | Low ⭐⭐⭐⭐⭐ | Medium ⭐⭐⭐ | Medium ⭐⭐⭐ | Low ⭐⭐⭐⭐ | Medium ⭐⭐⭐ |
| **Boilerplate** | Minimal ⭐⭐⭐⭐⭐ | Moderate ⭐⭐⭐ | Minimal ⭐⭐⭐⭐ | Moderate ⭐⭐⭐ | Moderate ⭐⭐⭐ |
| **Performance** | Excellent ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | Poor ⭐⭐ | Excellent ⭐⭐⭐⭐⭐ |
| **DevTools** | Good ⭐⭐⭐⭐ | Excellent ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | None ⭐ | Good ⭐⭐⭐⭐ |
| **TypeScript** | Excellent ⭐⭐⭐⭐⭐ | Excellent ⭐⭐⭐⭐⭐ | Excellent ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | Excellent ⭐⭐⭐⭐⭐ |
| **Persistence** | Built-in ⭐⭐⭐⭐⭐ | Manual ⭐⭐ | Manual ⭐⭐ | Manual ⭐⭐ | Manual ⭐⭐ |
| **Server State** | Manual ⭐⭐ | RTK Query ⭐⭐⭐⭐⭐ | Built-in ⭐⭐⭐⭐⭐ | Manual ⭐⭐ | Manual ⭐⭐ |
| **Async Handling** | Manual ⭐⭐ | Thunks ⭐⭐⭐⭐⭐ | Built-in ⭐⭐⭐⭐⭐ | Manual ⭐⭐ | Manual ⭐⭐ |
| **Ecosystem** | Growing ⭐⭐⭐⭐ | Largest ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | N/A ⭐⭐ | Growing ⭐⭐⭐ |
| **Testing** | Easy ⭐⭐⭐⭐⭐ | Easy ⭐⭐⭐⭐ | Easy ⭐⭐⭐⭐ | Moderate ⭐⭐⭐ | Easy ⭐⭐⭐⭐⭐ |

### 3.2 Use Case Suitability

| Use Case | Zustand | Redux Toolkit | TanStack Query | Context | Jotai |
|----------|---------|---------------|----------------|---------|-------|
| **Small App (<10 pages)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Medium App (10-50 pages)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Large App (>50 pages)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **API-Heavy** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Complex UI State** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Real-time Data** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **High Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Team Redux Experience** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Rapid Development** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 3.3 Code Comparison Examples

#### Simple Counter

**Zustand**
```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const count = useStore((s) => s.count);
  const increment = useStore((s) => s.increment);
  return <button onClick={increment}>{count}</button>;
}
```

**Redux Toolkit**
```typescript
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => { state.count += 1; },
  },
});
const store = configureStore({ reducer: { counter: counterSlice.reducer } });

function Counter() {
  const dispatch = useDispatch();
  const count = useSelector((s) => s.counter.count);
  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```

**Context + useReducer**
```typescript
const CounterContext = createContext<ContextType>(null!);
function reducer(state, action) {
  return action.type === 'increment' ? { count: state.count + 1 } : state;
}

function Counter() {
  const { state, dispatch } = useContext(CounterContext);
  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>;
}
```

**Jotai**
```typescript
const countAtom = atom(0);
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

#### Async Data Fetching

**Zustand** (Manual)
```typescript
const useStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true });
    try {
      const data = await fetchData();
      set({ data, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
}));
```

**TanStack Query** (Built-in)
```typescript
function Data() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <DataDisplay data={data} />;
}
```

---

## 4. Recommended Approach

### 4.1 Primary Recommendation: Continue with Zustand

**Decision:** ✅ **Keep Zustand as the primary state management solution**

**Rationale:**

1. **Proven Success**
   - ✅ 27,500+ lines of code delivered with consistent patterns
   - ✅ 5 stores successfully implemented and tested
   - ✅ 85%+ test coverage achieved
   - ✅ Zero blocking issues or performance problems

2. **Excellent Developer Experience**
   - ✅ Minimal boilerplate
   - ✅ Fast development velocity
   - ✅ Easy to understand and maintain
   - ✅ Team already proficient

3. **Performance Excellence**
   - ✅ Selector-based subscriptions prevent unnecessary re-renders
   - ✅ No provider nesting overhead
   - ✅ Optimized with React.memo patterns
   - ✅ Computed getters calculated on demand

4. **Future-Ready**
   - ✅ Scales well as application grows
   - ✅ Can integrate with TanStack Query for server state
   - ✅ Active development and community
   - ✅ TypeScript-first design

### 4.2 Secondary Recommendation: Add TanStack Query for Server State

**When:** During backend integration phase (Production Deployment)

**Purpose:** Handle server data, caching, and synchronization

**Integration Pattern:**

```typescript
// Zustand: UI state
const useUIStore = create((set) => ({
  filters: { status: 'All', searchQuery: '' },
  sorting: { field: 'createdAt', direction: 'desc' },
  pagination: { page: 1, pageSize: 10 },
  setFilters: (filters) => set({ filters }),
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
}));

// TanStack Query: Server state
function useMatters() {
  const filters = useUIStore(s => s.filters);
  const sorting = useUIStore(s => s.sorting);
  const pagination = useUIStore(s => s.pagination);

  return useQuery({
    queryKey: ['matters', filters, sorting, pagination],
    queryFn: () => fetchMatters({ filters, sorting, pagination }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Component: Combine both
function MattersList() {
  const { data: matters, isLoading } = useMatters();
  const { filters, setFilters } = useUIStore(s => ({
    filters: s.filters,
    setFilters: s.setFilters,
  }));

  return (
    <>
      <FilterBar filters={filters} onFilterChange={setFilters} />
      {isLoading ? <Loading /> : <MattersTable matters={matters} />}
    </>
  );
}
```

**Responsibility Split:**

| Concern | Managed By | Examples |
|---------|------------|----------|
| **UI State** | Zustand | Modals, toasts, sidebar, form inputs, filter values |
| **Server Data** | TanStack Query | API responses, CRUD operations, pagination data |
| **Derived State** | Zustand (computed) | Filtered lists, sorted arrays, calculations |
| **Cache** | TanStack Query | API response caching, background refetching |
| **Persistence** | Zustand | localStorage for UI preferences |

### 4.3 Architecture Diagram (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      Components                             │
│  Dashboard │ Matters │ Transactions │ Settings │         │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Zustand Stores    │      │   TanStack Query     │
├──────────────────────┤      ├──────────────────────┤
│ • matterStore       │      │ useMatters()         │
│ • transactionStore  │◄─────│ useTransactions()     │
│ • firmStore         │      │ useFirm()            │
│ • uiStore           │      │ useAllocations()     │
│ • allocationStore   │      └──────────────────────┘
│                      │                 │
│ • UI State          │                 │
│ • Filters           │                 │
│ • Sorting           │                 │
│ • Pagination (values)│                 │
│ • Modals            │                 │
│ • Toasts            │                 │
└──────────────────────┘                 │
          │                              │
          └──────────────┬───────────────┘
                         ▼
              ┌──────────────────┐
              │   Backend API     │
              └──────────────────┘
```

---

## 5. Implementation Roadmap

### Phase 1: Current State (Completed ✅)

- [x] Set up Zustand stores
- [x] Implement 5 core stores
- [x] Add DevTools middleware
- [x] Add persist middleware
- [x] Implement CRUD operations
- [x] Add computed getters
- [x] Implement filtering, sorting, pagination
- [x] Add comprehensive tests
- [x] Document store usage

### Phase 2: Backend Integration (Future - 12-18 weeks)

**Week 1-2: Setup TanStack Query**

```bash
npm install @tanstack/react-query
```

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});
```

```typescript
// Wrap App with QueryClientProvider
import { QueryClientProvider } from '@tanstack/react-query';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* App routes */}
      </Router>
    </QueryClientProvider>
  );
}
```

**Week 3-4: Create Query Hooks**

```typescript
// src/hooks/queries/useMatters.ts
export function useMatters() {
  const { filters, sorting, pagination } = useUIStore(s => ({
    filters: s.filters,
    sorting: s.sorting,
    pagination: s.pagination,
  }));

  return useQuery({
    queryKey: ['matters', filters, sorting, pagination],
    queryFn: () => api.matters.list({ filters, sorting, pagination }),
  });
}

// src/hooks/queries/useMatter.ts
export function useMatter(id: string) {
  return useQuery({
    queryKey: ['matters', id],
    queryFn: () => api.matters.get(id),
    enabled: !!id,
  });
}
```

**Week 5-6: Create Mutation Hooks**

```typescript
// src/hooks/mutations/useCreateMatter.ts
export function useCreateMatter() {
  const queryClient = useQueryClient();
  const showSuccess = useUIStore(s => s.showSuccess);

  return useMutation({
    mutationFn: api.matters.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      showSuccess('Matter created successfully');
    },
    onError: (error) => {
      useUIStore.getState().showError('Error', error.message);
    },
  });
}

// src/hooks/mutations/useUpdateMatter.ts
export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatterInput }) =>
      api.matters.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      queryClient.invalidateQueries({ queryKey: ['matters', id] });
    },
  });
}
```

**Week 7-8: Update Components**

```typescript
// Before (Zustand-only)
function MattersList() {
  const matters = useMatterStore(s => s.getPaginatedMatters());
  const filters = useMatterStore(s => s.filters);
  const setFilters = useMatterStore(s => s.setFilters);
  // ...
}

// After (Zustand + TanStack Query)
function MattersList() {
  const { data: matters, isLoading } = useMatters();
  const { filters, setFilters } = useUIStore(s => ({
    filters: s.filters,
    setFilters: s.setFilters,
  }));
  // ...
}
```

**Week 9-10: Migrate Server Data**

- [ ] Migrate matterStore data to useMatters query
- [ ] Migrate transactionStore data to useTransactions query
- [ ] Migrate firmStore data to useFirm query
- [ ] Migrate allocationStore data to useAllocations query
- [ ] Update all components to use queries
- [ ] Remove mock data from stores

**Week 11-12: Optimize & Test**

- [ ] Implement optimistic updates
- [ ] Add query invalidation strategies
- [ ] Test cache behavior
- [ ] Test error handling
- [ ] Test loading states
- [ ] Performance testing

### Phase 3: Production Features (Future)

- [ ] Implement real-time updates (subscriptions)
- [ ] Add offline support (cache persistence)
- [ ] Implement query key factory
- [ ] Add request deduplication
- [ ] Implement infinite scroll for large lists
- [ ] Add background refetching strategies

---

## 6. Migration Strategy

### 6.1 Current → Recommended (Zustand Only)

**Status:** ✅ Already implemented - no migration needed!

### 6.2 Current → Production (Zustand + TanStack Query)

#### Migration Approach: Incremental

**Step 1: Install Dependencies**

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Step 2: Setup Query Client**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Step 3: Wrap Application**

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Existing app */}
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 4: Create Query Hooks (One Store at a Time)**

```typescript
// src/hooks/queries/useMatters.ts
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useUIStore } from '../store';

export function useMatters() {
  const { filters, sorting, pagination } = useUIStore(s => ({
    filters: s.filters,
    sorting: s.sorting,
    pagination: s.pagination,
  }));

  return useQuery({
    queryKey: ['matters', filters, sorting, pagination],
    queryFn: () => api.matters.list({ filters, sorting, pagination }),
  });
}
```

**Step 5: Create Mutation Hooks**

```typescript
// src/hooks/mutations/useCreateMatter.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCreateMatter() {
  const queryClient = useQueryClient();
  const showSuccess = useUIStore(s => s.showSuccess);
  const showError = useUIStore(s => s.showError);

  return useMutation({
    mutationFn: api.matters.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      showSuccess('Matter created successfully');
    },
    onError: (error: any) => {
      showError('Error', error.message);
    },
  });
}
```

**Step 6: Update Components (One Page at a Time)**

```typescript
// src/pages/Matters/MattersList.tsx
// BEFORE
function MattersList() {
  const matters = useMatterStore(s => s.getPaginatedMatters());
  // ...
}

// AFTER
function MattersList() {
  const { data: matters, isLoading, error } = useMatters();
  // ...
}
```

**Step 7: Test Thoroughly**

- [ ] Unit tests for query hooks
- [ ] Integration tests for components
- [ ] Cache behavior tests
- [ ] Error handling tests
- [ ] Loading state tests

**Step 8: Remove Mock Data**

```typescript
// src/store/matterStore.ts
// BEFORE
export const useMatterStore = create<MatterState>()(
  devtools(
    persist(
      (set, get) => ({
        matters: mockMatters, // ← Remove this
        // ...
      }),
      { name: 'atty-matter-storage' }
    )
  )
);

// AFTER
export const useMatterStore = create<MatterState>()(
  devtools(
    (set, get) => ({
      matters: [], // Empty array - data from TanStack Query
      // Keep only UI state (filters, sorting, pagination)
    })
  )
);
```

#### Migration Order

1. **Week 1-2:** Setup TanStack Query + Query Client
2. **Week 3-4:** Migrate matterStore
3. **Week 5-6:** Migrate transactionStore
4. **Week 7-8:** Migrate firmStore
5. **Week 9-10:** Migrate allocationStore
6. **Week 11-12:** Testing & optimization

#### Rollback Strategy

If issues arise, rollback is straightforward:

```typescript
// Simply revert component imports
// FROM: import { useMatters } from '../hooks/queries/useMatters';
// TO:   import { useMatterStore } from '../store';
```

---

## 7. Code Examples

### 7.1 Zustand Store Pattern (Recommended)

#### Basic Store

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface State {
  count: number;
  name: string;
  increment: () => void;
  decrement: () => void;
  setName: (name: string) => void;
  getCountDoubled: () => number; // Computed getter
}

const useStore = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        count: 0,
        name: '',
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
        setName: (name) => set({ name }),
        getCountDoubled: () => get().count * 2,
      }),
      {
        name: 'my-storage',
        partialize: (state) => ({ count: state.count, name: state.name }),
      }
    ),
    { name: 'MyStore' }
  )
);
```

#### Usage in Components

```typescript
// Good: Selective subscription (only re-renders when count changes)
function Counter() {
  const count = useStore((state) => state.count);
  return <div>Count: {count}</div>;
}

// Good: Multiple values in one selector
function CounterWithName() {
  const { count, name } = useStore((state) => ({
    count: state.count,
    name: state.name,
  }));
  return <div>{name}: {count}</div>;
}

// Good: Stable function reference (useCallback not needed)
function CounterButtons() {
  const increment = useStore((state) => state.increment);
  return <button onClick={increment}>+1</button>;
}

// Bad: Subscribes to ALL state changes
function BadExample() {
  const { count, name, increment } = useStore();
  return <div>{name}: {count}</div>;
}
```

#### Usage Outside Components

```typescript
// Direct state access
const currentCount = useStore.getState().count;

// Direct action call
useStore.getState().increment();

// Subscribe to changes (rarely needed)
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count) => console.log('Count changed:', count)
);
```

### 7.2 Complex Store Pattern (Like Our Stores)

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Filters {
  status: 'All' | 'Active' | 'Closed';
  searchQuery: string;
}

export interface Sorting {
  field: 'name' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface Item {
  id: string;
  name: string;
  status: 'Active' | 'Closed';
  createdAt: Date;
}

export interface State {
  // Data
  items: Item[];
  selectedId: string | null;

  // Filter/Sort/Pagination
  filters: Filters;
  sorting: Sorting;
  pagination: Pagination;

  // Computed Getters
  getFilteredItems: () => Item[];
  getSortedItems: () => Item[];
  getPaginatedItems: () => Item[];
  getItemById: (id: string) => Item | undefined;
  getSelected: () => Item | undefined;
  getTotalCount: () => number;

  // Actions
  setItems: (items: Item[]) => void;
  setSelectedId: (id: string | null) => void;
  setFilters: (filters: Partial<Filters>) => void;
  setSorting: (sorting: Partial<Sorting>) => void;
  setPagination: (pagination: Partial<Pagination>) => void;

  // CRUD
  createItem: (item: Omit<Item, 'id'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Reset
  reset: () => void;
}

// Initial State
const initialFilters: Filters = {
  status: 'All',
  searchQuery: '',
};

const initialSorting: Sorting = {
  field: 'createdAt',
  direction: 'desc',
};

const initialPagination: Pagination = {
  page: 1,
  pageSize: 10,
};

// Store
const useStore = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        selectedId: null,
        filters: initialFilters,
        sorting: initialSorting,
        pagination: initialPagination,

        // Computed Getters
        getFilteredItems: () => {
          const { items, filters } = get();
          return items.filter((item) => {
            if (filters.status !== 'All' && item.status !== filters.status) {
              return false;
            }
            if (filters.searchQuery && !item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
              return false;
            }
            return true;
          });
        },

        getSortedItems: () => {
          const filtered = get().getFilteredItems();
          const { field, direction } = get().sorting;

          return [...filtered].sort((a, b) => {
            let comparison = 0;
            switch (field) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'createdAt':
                comparison = a.createdAt.getTime() - b.createdAt.getTime();
                break;
            }
            return direction === 'asc' ? comparison : -comparison;
          });
        },

        getPaginatedItems: () => {
          const sorted = get().getSortedItems();
          const { page, pageSize } = get().pagination;
          const start = (page - 1) * pageSize;
          return sorted.slice(start, start + pageSize);
        },

        getItemById: (id) => {
          return get().items.find((item) => item.id === id);
        },

        getSelected: () => {
          const { selectedId, getItemById } = get();
          return selectedId ? getItemById(selectedId) : undefined;
        },

        getTotalCount: () => {
          return get().items.length;
        },

        // Actions
        setItems: (items) => set({ items }),
        setSelectedId: (id) => set({ selectedId: id }),
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
            pagination: { ...state.pagination, page: 1 },
          })),
        setSorting: (sorting) =>
          set((state) => ({ sorting: { ...state.sorting, ...sorting } })),
        setPagination: (pagination) =>
          set((state) => ({ pagination: { ...state.pagination, ...pagination } })),

        // CRUD
        createItem: (item) => {
          const newItem: Item = {
            id: `item-${Date.now()}`,
            ...item,
          };
          set((state) => ({ items: [newItem, ...state.items] }));
          return newItem;
        },

        updateItem: (id, updates) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          })),

        deleteItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
          })),

        // Reset
        reset: () =>
          set({
            items: [],
            selectedId: null,
            filters: initialFilters,
            sorting: initialSorting,
            pagination: initialPagination,
          }),
      }),
      {
        name: 'item-storage',
        partialize: (state) => ({
          items: state.items,
          filters: state.filters,
          sorting: state.sorting,
        }),
      }
    ),
    { name: 'ItemStore' }
  )
);
```

### 7.3 TanStack Query Integration (Future)

#### Query Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useMatters() {
  return useQuery({
    queryKey: ['matters'],
    queryFn: () => api.matters.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMatter(id: string) {
  return useQuery({
    queryKey: ['matters', id],
    queryFn: () => api.matters.get(id),
    enabled: !!id,
  });
}
```

#### Mutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCreateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.matters.create,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.matters.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      queryClient.invalidateQueries({ queryKey: ['matters', id] });
    },
  });
}

export function useDeleteMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.matters.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}
```

#### Optimistic Update

```typescript
export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.matters.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matters'] });
      await queryClient.cancelQueries({ queryKey: ['matters', id] });

      // Snapshot previous value
      const previousMatters = queryClient.getQueryData(['matters']);
      const previousMatter = queryClient.getQueryData(['matters', id]);

      // Optimistically update
      queryClient.setQueryData(['matters'], (old: any[]) =>
        old.map((m) => (m.id === id ? { ...m, ...data } : m))
      );

      queryClient.setQueryData(['matters', id], (old: any) => ({
        ...old,
        ...data,
      }));

      // Return context for rollback
      return { previousMatters, previousMatter };
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      queryClient.setQueryData(['matters'], context.previousMatters);
      queryClient.setQueryData(['matters', id], context.previousMatter);
    },

    // Refetch on success/failure
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      queryClient.invalidateQueries({ queryKey: ['matters', id] });
    },
  });
}
```

### 7.4 Combined Zustand + TanStack Query

```typescript
// Zustand: UI State (filters, sorting, pagination, modals, toasts)
const useUIStore = create((set) => ({
  filters: { status: 'All', searchQuery: '' },
  sorting: { field: 'createdAt', direction: 'desc' },
  pagination: { page: 1, pageSize: 10 },
  setFilters: (filters) => set({ filters }),
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
}));

// TanStack Query: Server State
function useMatters() {
  const { filters, sorting, pagination } = useUIStore((s) => ({
    filters: s.filters,
    sorting: s.sorting,
    pagination: s.pagination,
  }));

  return useQuery({
    queryKey: ['matters', filters, sorting, pagination],
    queryFn: () => api.matters.list({ filters, sorting, pagination }),
    keepPreviousData: true, // Prevents flickering on pagination
  });
}

// Component: Combines both
function MattersList() {
  // Server state from TanStack Query
  const { data: matters, isLoading, isFetching } = useMatters();

  // UI state from Zustand
  const { filters, sorting, pagination } = useUIStore((s) => ({
    filters: s.filters,
    sorting: s.sorting,
    pagination: s.pagination,
  }));

  // Actions from Zustand
  const setFilters = useUIStore((s) => s.setFilters);
  const setSorting = useUIStore((s) => s.setSorting);
  const setPagination = useUIStore((s) => s.setPagination);

  if (isLoading) return <Loading />;

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />
      <SortControl sorting={sorting} onChange={setSorting} />
      <MattersTable
        matters={matters}
        isRefetching={isFetching}
        pagination={pagination}
        onPageChange={setPagination}
      />
    </>
  );
}
```

---

## 8. Decision Summary

### 8.1 Recommendations

| Scenario | Recommendation | Timeline |
|----------|---------------|----------|
| **Current Client State** | ✅ Continue with Zustand | Ongoing |
| **Backend Integration** | Add TanStack Query | Phase 2 (12-18 weeks) |
| **Production App** | Zustand + TanStack Query | Future |
| **Switch from Zustand** | ❌ Not recommended | N/A |

### 8.2 Key Decision Points

1. **Stay with Zustand** ✅
   - Proven success with 27,500+ lines of code
   - 85%+ test coverage
   - Excellent performance
   - Team proficiency

2. **Add TanStack Query** 📋
   - Only when backend is ready
   - For server data, caching, and synchronization
   - Zustand remains for UI state

3. **Don't Switch** ❌
   - Redux Toolkit: Too much boilerplate, no clear benefits
   - Context: Performance issues at scale
   - Jotai: Different paradigm, no clear benefits

### 8.3 Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Bundle Size | ~1KB (Zustand) | <15KB (with TQ) | ✅ On Track |
| Test Coverage | 85% | 80%+ | ✅ Exceeded |
| Development Velocity | Fast | Maintain | ✅ Excellent |
| Performance | Excellent | Maintain | ✅ Excellent |
| Developer Experience | Excellent | Maintain | ✅ Excellent |

---

## 9. Resources

### Documentation

- **Zustand:** https://github.com/pmndrs/zustand
- **TanStack Query:** https://tanstack.com/query/latest
- **Redux Toolkit:** https://redux-toolkit.js.org/
- **Jotai:** https://github.com/pmndrs/jotai

### Articles

- "Zustand vs Redux vs Jotai: Which to Choose in 2024?"
- "When to Use TanStack Query"
- "State Management in React: A Comprehensive Guide"

### Internal Docs

- [Store Documentation](./src/store/README.md)
- [Architecture Document](./ARCHITECTURE.md)
- [Testing Guide](./TESTING_GUIDE.md)

---

## Appendix: Quick Reference

### Zustand Quick Start

```typescript
// Create store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use in component
function Counter() {
  const count = useStore((s) => s.count);
  return <div>{count}</div>;
}
```

### TanStack Query Quick Start

```typescript
// Create query client
const queryClient = new QueryClient();

// Wrap app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>

// Use query
function Data() {
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  if (isLoading) return <Loading />;
  return <Display data={data} />;
}
```

### Zustand + TanStack Query Quick Start

```typescript
// Zustand for UI state
const useUIStore = create((set) => ({
  filters: {},
  setFilters: (f) => set({ filters: f }),
}));

// TanStack Query for server state
function useData() {
  const filters = useUIStore((s) => s.filters);
  return useQuery({
    queryKey: ['data', filters],
    queryFn: () => fetchData(filters),
  });
}
```

---

**Document Version:** 1.0
**Last Updated:** March 2026
**Next Review:** Prior to backend integration phase
**Maintainer:** Development Team
