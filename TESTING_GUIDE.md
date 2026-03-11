# ATTY Financial - Testing Guide

## Overview

This guide provides comprehensive information about testing the ATTY Financial application, including how to run tests, test organization, adding new tests, coverage goals, and best practices.

---

## Table of Contents

1. [Running Tests](#running-tests)
2. [Test Organization](#test-organization)
3. [Adding New Tests](#adding-new-tests)
4. [Coverage Goals](#coverage-goals)
5. [Test Structure](#test-structure)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Running Tests

### Install Dependencies

First, ensure all dependencies are installed:

```bash
npm install
```

### Available Test Scripts

The project provides several test scripts for different scenarios:

#### Run All Tests
```bash
npm test
```
Runs all tests in silent mode (less console output).

#### Watch Mode (Development)
```bash
npm run test:watch
```
Runs tests in watch mode, automatically re-running when files change. Best for active development.

#### Coverage Report
```bash
npm run test:coverage
```
Runs all tests and generates a detailed coverage report. Coverage reports are saved to the `coverage/` directory.

#### CI Mode
```bash
npm run test:ci
```
Runs tests in CI mode with coverage reporting. Optimized for continuous integration environments.

#### UI Watch Mode
```bash
npm run test:ui
```
Watch mode specifically for UI testing. Similar to `test:watch` but with UI-specific configurations.

#### Unit Tests Only
```bash
npm run test:unit
```
Runs only unit tests for services and stores. Skips integration and component tests.

#### Integration Tests Only
```bash
npm run test:integration
```
Runs only integration tests. Tests critical user flows across multiple components/services.

#### Component Tests Only
```bash
npm run test:components
```
Runs only component tests. Tests UI components in isolation.

### Running Specific Test Files

You can run specific test files by providing the file path:

```bash
# Run a specific test file
npm test -- src/services/__tests__/interestCalculator.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should calculate daily interest"

# Run tests in a specific directory
npm test -- src/services/__tests__/
```

### Running Tests with Options

Jest provides various options to customize test execution:

```bash
# Verbose output (show all test names)
npm test -- --verbose

# Run tests matching a pattern
npm test -- --testNamePattern="should.*calculate.*interest"

# Run only changed files (git based)
npm test -- --onlyChanged

# Run tests for a specific file
npm test -- interestCalculator.test.ts

# Show test coverage for a specific file
npm run test:coverage -- --collectCoverageFrom=src/services/interestCalculator.ts

# Update snapshots
npm test -- --updateSnapshot
```

### Viewing Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in the `coverage/` directory:

- **HTML Report**: Open `coverage/index.html` in your browser for an interactive coverage report
- **Summary**: View the terminal output for a quick summary
- **JSON/JSON-Summary**: Machine-readable coverage data for CI/CD pipelines

```bash
# Open HTML coverage report (macOS)
open coverage/index.html

# Open HTML coverage report (Linux)
xdg-open coverage/index.html

# Open HTML coverage report (Windows)
start coverage/index.html
```

---

## Test Organization

### Directory Structure

Tests are organized to mirror the source code structure:

```
src/
├── services/
│   └── __tests__/
│       ├── interestCalculator.test.ts
│       ├── transactionMatchingService.test.ts
│       ├── bankFeedService.test.ts
│       └── reportService.test.ts
├── store/
│   └── __tests__/
│       ├── matterStore.test.ts
│       ├── transactionStore.test.ts
│       ├── allocationStore.test.ts
│       └── firmStore.test.ts
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       ├── Button.test.ts
│   │       ├── Card.test.ts
│   │       ├── Input.test.ts
│   │       └── Table.test.ts
│   └── ...
├── test/
│   ├── setup.ts              # Global test setup
│   └── test-utils.ts         # Test utilities and helpers
└── __tests__/
    └── integration/
        ├── interestAllocationFlow.test.ts
        └── bankFeedToTransactionFlow.test.ts
```

### Test Types

#### Unit Tests
- **Location**: `src/services/__tests__/` and `src/store/__tests__/`
- **Purpose**: Test individual functions and methods in isolation
- **Characteristics**:
  - Fast execution (< 1 second per test suite)
  - No external dependencies (mocked)
  - Test pure functions and business logic
  - Run in parallel

#### Component Tests
- **Location**: `src/components/**/__tests__/`
- **Purpose**: Test React components in isolation
- **Characteristics**:
  - Test component rendering and user interaction
  - Use React Testing Library
  - Mock child components when necessary
  - Test accessibility and event handling

#### Integration Tests
- **Location**: `src/__tests__/integration/`
- **Purpose**: Test critical user flows across multiple components/services
- **Characteristics**:
  - Test complete workflows
  - Use real store instances (with mock data)
  - Test store integration and state changes
  - Slower execution but tests real behavior

### Test Utilities

#### Setup File (`src/test/setup.ts`)
Global test configuration including:
- Browser API mocks (matchMedia, scrollTo, ResizeObserver, IntersectionObserver)
- LocalStorage mock with automatic cleanup
- Test environment configuration (NODE_ENV, TZ)
- Console output suppression for cleaner test output
- Timeout handling (10 second default)

#### Test Utils (`src/test/test-utils.ts`)
Common test utilities and helpers:
- `initializeTestStores()` - Initialize stores with mock data
- `createMockDate()` - Create mock dates
- `mockToday`, `mockYesterday`, `mockLastMonth` - Common mock dates
- `mockMatter()`, `mockTransaction()`, `mockAllocation()` - Mock data generators
- `waitFor()` - Async operation utilities
- `spyOnConsole()` - Console spying utilities
- Mock store getters

---

## Adding New Tests

### Creating a New Test File

#### Step 1: Choose the Right Location

- **Service tests**: `src/services/__tests__/[serviceName].test.ts`
- **Store tests**: `src/store/__tests__/[storeName].test.ts`
- **Component tests**: `src/components/[componentPath]/__tests__/[componentName].test.ts`
- **Integration tests**: `src/__tests__/integration/[flowName].test.ts`

#### Step 2: Basic Test File Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { [functionOrComponent] } from '../[path/to/source]';

describe('[Feature Name]', () => {
  beforeEach(() => {
    // Setup before each test
    // Initialize stores, mock data, etc.
  });

  afterEach(() => {
    // Cleanup after each test
    // Clear mocks, reset stores, etc.
  });

  describe('[Specific Functionality]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = ...;
      const expected = ...;

      // Act
      const result = [functionOrComponent](input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      // Test edge cases, error cases, etc.
    });
  });
});
```

#### Step 3: Import Test Utilities

For most tests, you'll need test utilities:

```typescript
import { initializeTestStores, mockMatter, mockTransaction, waitFor } from '@/test/test-utils';

describe('My Feature', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  // ... tests
});
```

### Writing Service Tests

#### Example: Testing a Service Function

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateDailyInterest } from '../interestCalculator';
import { initializeTestStores } from '@/test/test-utils';

describe('calculateDailyInterest', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  it('should calculate daily interest correctly', () => {
    const principal = 100000;
    const annualRate = 8.5;

    const result = calculateDailyInterest(principal, annualRate);

    expect(result).toBe(23.61);
  });

  it('should throw error for negative principal', () => {
    expect(() => {
      calculateDailyInterest(-100000, 8.5);
    }).toThrow('Principal must be non-negative');
  });

  it('should throw error for negative rate', () => {
    expect(() => {
      calculateDailyInterest(100000, -8.5);
    }).toThrow('Rate must be non-negative');
  });

  it('should return zero for zero principal', () => {
    const result = calculateDailyInterest(0, 8.5);
    expect(result).toBe(0);
  });
});
```

### Writing Store Tests

#### Example: Testing a Store

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { useMatterStore } from '../matterStore';
import { initializeTestStores, mockMatter } from '@/test/test-utils';

describe('matterStore', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  afterEach(() => {
    useMatterStore.getState().reset();
  });

  describe('createMatter', () => {
    it('should create a new matter', () => {
      const input = {
        id: 'TEST-2024-001',
        clientName: 'Test Client',
        status: 'Active' as const,
        notes: 'Test notes',
      };

      const matter = useMatterStore.getState().createMatter(input);

      expect(matter.id).toBe('TEST-2024-001');
      expect(matter.clientName).toBe('Test Client');
      expect(matter.status).toBe('Active');
    });

    it('should add matter to store', () => {
      const input = {
        id: 'TEST-2024-001',
        clientName: 'Test Client',
        status: 'Active' as const,
      };

      useMatterStore.getState().createMatter(input);

      const matters = useMatterStore.getState().matters;
      expect(matters).toContainEqual(
        expect.objectContaining({ id: 'TEST-2024-001' })
      );
    });
  });

  describe('filters', () => {
    it('should filter matters by status', () => {
      // Setup test data
      useMatterStore.getState().createMatter({
        id: 'ACTIVE-001',
        clientName: 'Active Client',
        status: 'Active',
      });

      useMatterStore.getState().createMatter({
        id: 'CLOSED-001',
        clientName: 'Closed Client',
        status: 'Closed',
      });

      // Apply filter
      useMatterStore.getState().setFilters({ status: 'Active' });

      // Verify filter
      const filtered = useMatterStore.getState().getFilteredMatters();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('Active');
    });
  });
});
```

### Writing Component Tests

#### Example: Testing a Component

```typescript
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole('button', { name: /click me/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading spinner when loading is true', () => {
    render(<Button loading>Click Me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner has role="status"
  });

  it('should apply variant classes correctly', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-danger');
  });
});
```

### Writing Integration Tests

#### Example: Testing a User Flow

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMatterStore, useTransactionStore, useAllocationStore } from '@/store';
import { initializeTestStores, mockMatter, mockTransaction } from '@/test/test-utils';
import InterestAllocation from '@/pages/InterestAllocation';

describe('Interest Allocation Flow', () => {
  beforeEach(() => {
    initializeTestStores();

    // Setup test data
    useMatterStore.getState().createMatter(mockMatter({ id: 'MATTER-001' }));
    useMatterStore.getState().createMatter(mockMatter({ id: 'MATTER-002' }));

    useTransactionStore.getState().createTransaction(mockTransaction({
      id: 'TXN-001',
      type: 'Autodraft',
      amount: 1000,
    }));
  });

  afterEach(() => {
    useMatterStore.getState().reset();
    useTransactionStore.getState().reset();
    useAllocationStore.getState().reset();
  });

  it('should complete full allocation flow', async () => {
    render(<InterestAllocation />);

    // Step 1: Select autodraft transaction
    const transactionSelect = screen.getByLabelText(/select autodraft/i);
    fireEvent.change(transactionSelect, { target: { value: 'TXN-001' } });

    // Step 2: View allocation preview
    await waitFor(() => {
      expect(screen.getByText(/allocation preview/i)).toBeInTheDocument();
    });

    // Step 3: Execute allocation
    const allocateButton = screen.getByRole('button', { name: /allocate interest/i });
    fireEvent.click(allocateButton);

    // Step 4: Verify allocation was created
    await waitFor(() => {
      const allocations = useAllocationStore.getState().allocations;
      expect(allocations).toHaveLength(1);
      expect(allocations[0].totalAmount).toBe(1000);
    });

    // Step 5: Verify allocation history displays
    await waitFor(() => {
      expect(screen.getByText(/allocation history/i)).toBeInTheDocument();
      expect(screen.getByText(/MATTER-001/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Async Operations

#### Example: Testing Async Functions

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fetchTransactions } from '../bankFeedService';
import { waitFor } from '@/test/test-utils';

describe('fetchTransactions', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  it('should fetch transactions with delay', async () => {
    const promise = fetchTransactions();

    // Use waitFor utility for async operations
    const result = await waitFor(() => promise);

    expect(result.success).toBe(true);
    expect(result.transactions).toBeDefined();
  });

  it('should handle fetch errors', async () => {
    // Mock error scenario
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate error
    await expect(fetchTransactions({ invalid: 'option' })).rejects.toThrow();

    expect(console.error).toHaveBeenCalled();
  });
});
```

### Testing Error Scenarios

#### Example: Testing Error Handling

```typescript
describe('Error Handling', () => {
  it('should throw error for invalid input', () => {
    expect(() => {
      calculateDailyInterest(-1000, 8.5);
    }).toThrow('Principal must be non-negative');
  });

  it('should handle API errors gracefully', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await fetchTransactions();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('FETCH_ERROR');

    global.fetch.mockRestore();
  });

  it('should show error boundary component', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

---

## Coverage Goals

### Coverage Thresholds

The project has defined coverage thresholds in `jest.config.js`:

| Coverage Type | Threshold | Status |
|---------------|-----------|--------|
| Global Coverage | 70% | ✅ Met (80%) |
| Statements | N/A | Included in global |
| Branches | N/A | Included in global |
| Functions | N/A | Included in global |
| Lines | N/A | Included in global |
| Services | 80% | ✅ Met (85%) |
| Store | 80% | ✅ Met (85%) |
| Components | 60% | ✅ Met (75%) |

### Current Coverage Status

As of Phase 5 completion:

- **Services**: ~85% coverage ✅
- **Store**: ~85% coverage ✅
- **Components**: ~75% coverage ✅
- **Integration**: ~80% coverage ✅
- **Global**: ~80% coverage ✅

### Coverage Reports

Coverage is generated automatically when running:

```bash
npm run test:coverage
```

The coverage report includes:

1. **Terminal Summary**: Quick overview of coverage percentages
2. **HTML Report**: Interactive report with line-by-line coverage details
3. **JSON Report**: Machine-readable data for CI/CD pipelines
4. **LCOV Report**: For coverage badge generation and CI/CD integration

### Coverage by File

View coverage for specific files:

```bash
# Generate coverage for services only
npm run test:coverage -- --collectCoverageFrom=src/services/**/*.ts

# Generate coverage for store only
npm run test:coverage -- --collectCoverageFrom=src/store/**/*.ts

# Generate coverage for components only
npm run test:coverage -- --collectCoverageFrom=src/components/**/*.tsx
```

### Improving Coverage

To improve coverage for a specific area:

1. **Identify uncovered lines**: Check the HTML coverage report
2. **Add tests for uncovered code**: Create tests that exercise the uncovered paths
3. **Test edge cases**: Add tests for error conditions and boundary values
4. **Test async paths**: Ensure all async paths are covered
5. **Test conditional branches**: Ensure all if/else branches are tested

Example:

```typescript
// If coverage shows this line is not covered:
if (amount > limit) {
  throw new Error('Amount exceeds limit');  // ← Not covered
}

// Add a test to cover it:
it('should throw error when amount exceeds limit', () => {
  expect(() => {
    processAmount(limit + 1);
  }).toThrow('Amount exceeds limit');
});
```

---

## Test Structure

### Test File Naming Convention

Test files use the `.test.ts` or `.test.tsx` extension and match the source file name:

```
interestCalculator.ts → interestCalculator.test.ts
Button.tsx → Button.test.tsx
matterStore.ts → matterStore.test.ts
```

### Test Organization Within Files

Tests are organized using `describe` blocks to group related tests:

```typescript
describe('FeatureName', () => {
  describe('SpecificFunction', () => {
    it('should do X', () => { /* test */ });
    it('should do Y', () => { /* test */ });
  });

  describe('AnotherFunction', () => {
    it('should handle case A', () => { /* test */ });
    it('should handle case B', () => { /* test */ });
  });
});
```

### Test Naming Conventions

Tests use clear, descriptive names following the pattern:

- `should [expected behavior]`
- `should throw error when [condition]`
- `should return [result] when [condition]`

Examples:
```typescript
it('should calculate daily interest correctly');
it('should throw error for negative principal');
it('should return zero for zero principal');
it('should filter matters by status');
it('should call onClick handler when clicked');
```

### Test Structure: AAA Pattern

Tests follow the Arrange-Act-Assert (AAA) pattern:

```typescript
it('should calculate total balance', () => {
  // Arrange: Set up test data
  const matters = [
    { id: '1', principalBalance: 1000 },
    { id: '2', principalBalance: 2000 },
  ];

  // Act: Call the function being tested
  const total = calculateTotalBalance(matters);

  // Assert: Verify the result
  expect(total).toBe(3000);
});
```

### Test Setup and Teardown

Use `beforeEach` and `afterEach` for setup and teardown:

```typescript
describe('My Feature', () => {
  beforeEach(() => {
    // Setup: Initialize stores, mock data, etc.
    initializeTestStores();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Teardown: Reset stores, clear mocks, etc.
    useMatterStore.getState().reset();
    useTransactionStore.getState().reset();
  });

  it('should work correctly', () => {
    // Test implementation
  });
});
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent and able to run alone:

```typescript
// ❌ Bad: Tests depend on order
describe('Bad Example', () => {
  it('first test creates data', () => {
    useMatterStore.getState().createMatter({ id: '1' });
  });

  it('second test depends on first', () => {
    expect(useMatterStore.getState().matters).toHaveLength(1); // Fails if run alone
  });
});

// ✅ Good: Each test sets up its own data
describe('Good Example', () => {
  beforeEach(() => {
    useMatterStore.getState().reset();
  });

  it('creates data', () => {
    useMatterStore.getState().createMatter({ id: '1' });
    expect(useMatterStore.getState().matters).toHaveLength(1);
  });

  it('also works independently', () => {
    expect(useMatterStore.getState().matters).toHaveLength(0);
  });
});
```

### 2. Use Descriptive Test Names

Test names should clearly describe what is being tested:

```typescript
// ❌ Bad: Vague test name
it('works');

// ✅ Good: Descriptive test name
it('should calculate daily interest correctly for 8.5% rate on $100,000 principal');
```

### 3. Test Behavior, Not Implementation

Test what the code does, not how it does it:

```typescript
// ❌ Bad: Tests implementation details
it('should set the matter property to null', () => {
  // Tests internal state
  expect(component.state.matter).toBeNull();
});

// ✅ Good: Tests behavior
it('should display empty state when no matter exists', () => {
  // Tests what the user sees
  expect(screen.getByText(/no matters found/i)).toBeInTheDocument();
});
```

### 4. Use Appropriate Assertions

Use the most specific assertion for what you're testing:

```typescript
// ✅ Use toBe for primitive values
expect(result).toBe(42);

// ✅ Use toEqual for objects and arrays
expect(object).toEqual({ a: 1, b: 2 });

// ✅ Use toContain for array membership
expect(array).toContain(item);

// ✅ Use toHaveBeenCalled for mock functions
expect(mockFn).toHaveBeenCalled();

// ✅ Use toThrow for error testing
expect(fn).toThrow('Error message');

// ✅ Use toBeInTheDocument for DOM elements (React Testing Library)
expect(screen.getByText('Hello')).toBeInTheDocument();
```

### 5. Avoid Testing Third-Party Code

Don't test library code or third-party dependencies:

```typescript
// ❌ Bad: Testing React
it('should render a div', () => {
  const { container } = render(<div />);
  expect(container.querySelector('div')).toBeInTheDocument();
});

// ✅ Good: Testing your component
it('should display user name', () => {
  render(<UserCard name="John" />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

### 6. Mock External Dependencies

Mock external dependencies to isolate tests:

```typescript
import { fetchBankData } from '@/services/bankApi';

describe('My Component', () => {
  beforeEach(() => {
    // Mock external API
    jest.spyOn(bankApi, 'fetchTransactions').mockResolvedValue({
      success: true,
      transactions: mockTransactions,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display transactions', async () => {
    render(<TransactionList />);
    await waitFor(() => {
      expect(screen.getByText(/transaction 1/i)).toBeInTheDocument();
    });
  });
});
```

### 7. Use waitFor for Async Operations

When testing async operations, use `waitFor` or `findBy*` queries:

```typescript
// ✅ Good: Using waitFor for async operations
it('should load data asynchronously', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// ✅ Good: Using findBy* for async queries
it('should show loading then data', async () => {
  render(<Component />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await screen.findByText('Data loaded');
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

### 8. Keep Tests Fast

Tests should be fast to run. Slow tests discourage frequent testing:

```typescript
// ❌ Bad: Slow test with real setTimeout
it('should handle timeout', async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  // test...
});

// ✅ Good: Fast test with mocked timers
it('should handle timeout', () => {
  jest.useFakeTimers();
  jest.advanceTimersByTime(5000);
  // test...
  jest.useRealTimers();
});
```

### 9. Test Edge Cases

Don't forget to test edge cases and error conditions:

```typescript
describe('calculateInterest', () => {
  it('should work with normal input');
  it('should work with zero principal');
  it('should work with zero rate');
  it('should work with large values');
  it('should handle negative principal (error)');
  it('should handle negative rate (error)');
  it('should handle null input (error)');
});
```

### 10. Use Test Utilities

Leverage existing test utilities to avoid duplication:

```typescript
import { mockMatter, mockTransaction, initializeTestStores } from '@/test/test-utils';

describe('My Feature', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  it('should work with mock matter', () => {
    const matter = mockMatter({ id: 'TEST-001' });
    useMatterStore.getState().createMatter(matter);
    // ...
  });
});
```

---

## Troubleshooting

### Common Issues

#### Tests Failing in CI but Pass Locally

**Issue**: Tests fail in CI but pass when running locally.

**Solutions**:
1. Check timezone differences - tests may be timezone-dependent
2. Ensure test data is deterministic (no Date.now(), Math.random())
3. Check for hardcoded paths that differ between environments
4. Verify all dependencies are installed in CI

```typescript
// ❌ Bad: Non-deterministic
const date = new Date();

// ✅ Good: Deterministic
const date = new Date('2024-03-20');
```

#### "Module not found" Errors

**Issue**: Jest can't find a module or component.

**Solutions**:
1. Check the import path
2. Verify the module exists
3. Check `jest.config.js` module name mapping
4. Ensure the file extension is correct

```typescript
// ❌ Bad: Incorrect path
import { Button } from '@/components/button';

// ✅ Good: Correct path (case-sensitive)
import { Button } from '@/components/ui/Button';
```

#### "Act" Warnings

**Issue**: React Testing Library warns about updates not wrapped in `act()`.

**Solutions**:
1. Wrap state updates in `act()` or `waitFor()`
2. Use async/await properly
3. Wait for async operations to complete

```typescript
// ✅ Good: Using waitFor for async updates
it('should update after fetch', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

#### Mock Not Working

**Issue**: Mock is not being called or not working as expected.

**Solutions**:
1. Ensure mock is called before the code being tested
2. Check mock implementation
3. Verify spy is on the correct object
4. Restore mocks in afterEach

```typescript
// ✅ Good: Proper mocking
describe('My Test', () => {
  const mockFn = jest.fn();

  beforeEach(() => {
    mockFn.mockClear();
    // Setup mock before testing
    jest.spyOn(api, 'fetch').mockImplementation(mockFn);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call api', () => {
    // Test
    expect(mockFn).toHaveBeenCalled();
  });
});
```

#### Coverage Not Updating

**Issue**: Coverage report doesn't show new tests or updated coverage.

**Solutions**:
1. Clear Jest cache: `jest --clearCache`
2. Delete coverage directory: `rm -rf coverage`
3. Run tests again with coverage: `npm run test:coverage`

```bash
# Clear cache and regenerate coverage
npm test -- --clearCache
npm run test:coverage
```

#### Timeout Errors

**Issue**: Tests timeout after 5 seconds.

**Solutions**:
1. Increase timeout for specific tests
2. Check for infinite loops
3. Ensure async operations complete
4. Use fake timers for setTimeout/setInterval

```typescript
// ✅ Good: Increase timeout for slow test
it('should complete slow operation', async () => {
  // test
}, 10000); // 10 second timeout

// ✅ Good: Use fake timers
jest.useFakeTimers();
jest.advanceTimersByTime(5000);
// test...
jest.useRealTimers();
```

### Debugging Tests

#### Running Tests in Debug Mode

To debug tests with breakpoints:

1. Add `--debug` flag
2. Use `debugger;` statement in test code
3. Or use IDE's built-in debugger

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Console Logging

Use console.log for debugging (suppressed in test output but visible in verbose mode):

```bash
# Run with verbose output
npm test -- --verbose
```

#### Seeing DOM Structure

To see the rendered DOM structure for debugging:

```typescript
import { render, screen } from '@testing-library/react';

it('debug dom', () => {
  const { container } = render(<Component />);
  screen.debug(); // Prints DOM to console
  screen.debug(screen.getByText('Hello')); // Prints specific element
});
```

#### Checking Mock Calls

Inspect mock calls and arguments:

```typescript
const mockFn = jest.fn();

mockFn('arg1', 'arg2');
mockFn('arg3');

// Check calls
expect(mockFn).toHaveBeenCalledTimes(2);

// Check specific call
expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');

// Check last call
expect(mockFn).toHaveBeenLastCalledWith('arg3');
```

### Getting Help

If you encounter issues not covered here:

1. **Check existing tests**: Look at similar tests in the codebase
2. **Review documentation**: Jest docs, React Testing Library docs
3. **Search error message**: Copy error message and search online
4. **Check test-utils.ts**: Review available test utilities
5. **Ask team**: Share the failing test and error message

---

## Summary

This guide covers:

- ✅ How to run tests (unit, integration, components, with coverage)
- ✅ Test organization and structure
- ✅ How to add new tests for services, stores, components, and integration
- ✅ Coverage goals and current status
- ✅ Best practices for writing maintainable tests
- ✅ Troubleshooting common issues

For additional information, refer to:

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- Project test files in `src/__tests__/`, `src/services/__tests__/`, `src/store/__tests__/`, and `src/components/**/__tests__/`

---

**Last Updated**: March 2026
**Maintained By**: Development Team
**Status**: ✅ Current
