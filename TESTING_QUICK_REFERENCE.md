# Quick Testing Reference Guide

## Running Tests

### All Tests
```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm run test:coverage
```

### Watch Mode
```bash
# Run tests in watch mode (for development)
npm run test:watch

# Run UI tests in watch mode
npm run test:ui
```

### Specific Test Types
```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only component tests
npm run test:components
```

### CI/CD
```bash
# Run tests in CI mode
npm run test:ci
```

## Understanding Test Output

### Success Indicators
- **PASS** - Test passed successfully
- **✓ built in XXXms** - Build succeeded
- **Coverage Summary** - Shows coverage percentage

### Failure Indicators
- **FAIL** - Test failed
- **Error Message** - Descriptive error with line number
- **Stack Trace** - Shows where error occurred

### Coverage Report
- **Statements** - % of code statements tested
- **Branches** - % of conditional branches tested
- **Functions** - % of functions tested
- **Lines** - % of code lines tested

## Common Test Issues

### Test Fails to Run
```bash
# Clear Jest cache
rm -rf node_modules/.cache
rm -rf .jest-cache

# Reinstall dependencies
npm install

# Run tests again
npm test
```

### Coverage Threshold Not Met
- Check coverage report
- Identify uncovered areas
- Write tests for uncovered code
- Run `npm run test:coverage` again

### Import Errors
- Check imports in test files
- Ensure proper path to tested module
- Verify TypeScript types
- Check module exports

### Mocking Issues
- Verify mock setup in test setup file
- Check mock implementation
- Ensure mock cleanup in afterEach
- Verify mock function return values

## Debugging Tests

### Run Specific Test File
```bash
# Run specific test file
npm test -- src/services/__tests__/interestCalculator.test.ts

# Run with debug output
npm test -- src/services/__tests__/interestCalculator.test.ts -- --verbose
```

### Run Specific Test
```bash
# Run test matching pattern
npm test -- --testNamePattern="should add"

# Run tests in specific describe block
npm test -- --testPathPattern=".*CRUD.*"
```

### Run Tests with Source Maps
```bash
# Run tests with source maps enabled
npm test -- --source-maps
```

## Coverage Reports

### View HTML Coverage Report
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Or in browser
chrome coverage/index.html
```

### Coverage Report Locations
- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Console output

## Test Patterns

### Unit Test Pattern
```typescript
describe('Component/Service Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Teardown
  });

  describe('Feature Name', () => {
    it('should do X when Y', () => {
      // Test implementation
    });
  });
});
```

### Integration Test Pattern
```typescript
describe('Flow Name Integration', () => {
  it('should complete entire flow end-to-end', () => {
    // Flow implementation
  });

  it('should handle errors gracefully', () => {
    // Error handling test
  });
});
```

### Component Test Pattern
```typescript
describe('Component Name', () => {
  it('should render with props', () => {
    // Render test
  });

  it('should handle user interaction', () => {
    // Interaction test
  });
});
```

## Performance Benchmarks

### Target Execution Times
- **Unit Tests**: < 30 seconds total
- **Integration Tests**: < 60 seconds total
- **Component Tests**: < 45 seconds total
- **All Tests**: < 135 seconds total

### Memory Usage
- **Peak Memory**: < 500MB for test run
- **Individual Test**: < 50MB per test
- **Watch Mode**: < 300MB steady state

## Best Practices

### Writing Tests
- ✅ Write descriptive test names ("should add a new matter")
- ✅ Use AAA pattern (Arrange, Act, Assert)
- ✅ Test both happy path and error cases
- ✅ Keep tests focused and independent
- ✅ Use beforeEach/afterEach for setup/teardown

### Running Tests
- ✅ Run tests before committing
- ✅ Run `npm run test:coverage` before PR
- ✅ Use watch mode during development
- ✅ Check coverage thresholds
- ✅ Fix failing tests immediately

### Maintaining Tests
- ✅ Keep tests updated with code changes
- ✅ Remove tests for removed features
- ✅ Update tests for modified features
- ✅ Add tests for new features
- ✅ Review coverage regularly

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### GitLab CI Example
```yaml
test:
  stage: test
  script:
    - npm ci
    - npm run test:ci
  coverage: '/Coverage report/'
  artifacts:
    paths:
      - coverage/
```

## Getting Help

### Common Issues
- **Test fails locally but passes in CI**: Check environment variables
- **Coverage different locally vs CI**: Check test patterns in CI
- **Tests timeout**: Increase timeout in Jest config
- **Tests flaky**: Check async operations and mocks

### Resources
- **Jest Documentation**: https://jestjs.io/
- **React Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/testing-react-hooks-cheat-sheet

## Summary

This guide covers:
- Running all types of tests
- Understanding test output
- Common issues and solutions
- Debugging failing tests
- Coverage reports
- Test patterns
- Performance benchmarks
- Best practices
- CI/CD integration
- Getting help

Follow this guide to effectively use the testing infrastructure! 🚀
