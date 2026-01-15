# Testing Guide for Iron Faith

This guide covers how to write and run tests for the Iron Faith application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Test Structure](#test-structure)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)

## Getting Started

The testing infrastructure is already set up with:

- **Jest**: Testing framework
- **React Native Testing Library**: Component testing utilities
- **jest-expo**: Expo preset for Jest

All dependencies are installed and configured.

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for automated builds)
npm run test:ci
```

### Test Output

Tests will show:
- Number of passing/failing tests
- Test execution time
- Coverage percentages (with coverage flag)
- Detailed error messages for failures

## Writing Tests

### Component Tests

Component tests are located in `components/__tests__/` alongside the components they test.

**Example: Testing a component**

```typescript
import { render, fireEvent } from '../../__tests__/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Utility Function Tests

Utility tests are located in `utils/__tests__/`.

**Example: Testing a utility function**

```typescript
import { myUtilFunction } from '../myUtils';

describe('myUtilFunction', () => {
  it('returns correct value for valid input', () => {
    const result = myUtilFunction('input');
    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myUtilFunction('')).toBe('default');
    expect(myUtilFunction(null)).toBe('default');
  });
});
```

### Hook Tests

Hook tests are located in `hooks/__tests__/` or `utils/__tests__/` for context hooks.

**Example: Testing a custom hook**

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('updates state on action', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

## Test Structure

### File Organization

```
project/
├── components/
│   ├── __tests__/
│   │   ├── ChatBubble.test.tsx
│   │   └── LoadingDots.test.tsx
│   ├── ChatBubble.tsx
│   └── LoadingDots.tsx
├── utils/
│   ├── __tests__/
│   │   ├── bible.test.ts
│   │   ├── database.test.ts
│   │   └── settings.test.tsx
│   ├── bible.ts
│   └── database.ts
├── hooks/
│   ├── __tests__/
│   │   └── useFrameworkReady.test.ts
│   └── useFrameworkReady.ts
└── __tests__/
    └── test-utils.tsx
```

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Hook tests: `useHookName.test.ts`

### Test Structure Template

```typescript
describe('ComponentOrFunction', () => {
  // Setup (if needed)
  beforeEach(() => {
    // Reset mocks, initialize data
  });

  // Group related tests
  describe('feature or method', () => {
    it('does something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Best Practices

### 1. Write Clear Test Descriptions

```typescript
// Good
it('displays error message when login fails', () => { ... });

// Bad
it('works', () => { ... });
```

### 2. Test One Thing at a Time

```typescript
// Good
it('validates email format', () => { ... });
it('shows error for invalid email', () => { ... });

// Bad - testing multiple things
it('validates email and shows error', () => { ... });
```

### 3. Use the AAA Pattern

```typescript
it('increments counter', () => {
  // Arrange
  const { result } = renderHook(() => useCounter());

  // Act
  act(() => result.current.increment());

  // Assert
  expect(result.current.count).toBe(1);
});
```

### 4. Mock External Dependencies

```typescript
// Mock API calls
jest.mock('../utils/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' })
}));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Common Patterns

### Testing Async Code

```typescript
it('fetches data successfully', async () => {
  const { getByText } = render(<DataComponent />);

  // Wait for async operations
  await waitFor(() => {
    expect(getByText('Loaded')).toBeTruthy();
  });
});
```

### Testing with Providers

```typescript
import { render } from '../../__tests__/test-utils';

// test-utils.tsx already wraps with AuthProvider and SettingsProvider
it('accesses context', () => {
  const { result } = render(<MyComponent />);
  expect(result).toBeTruthy();
});
```

### Testing User Interactions

```typescript
it('handles text input', () => {
  const { getByPlaceholderText } = render(<LoginForm />);
  const input = getByPlaceholderText('Email');

  fireEvent.changeText(input, 'test@example.com');
  expect(input.props.value).toBe('test@example.com');
});
```

### Testing Navigation

```typescript
import { useRouter } from 'expo-router';

jest.mock('expo-router');

it('navigates on button press', () => {
  const mockPush = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

  const { getByText } = render(<NavButton />);
  fireEvent.press(getByText('Go'));

  expect(mockPush).toHaveBeenCalledWith('/destination');
});
```

## Coverage Goals

Aim for these coverage targets:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage report will be displayed in the terminal and also generated as HTML in the `coverage/` directory.

## Testing Checklist

When adding a new feature:

- [ ] Write unit tests for utility functions
- [ ] Write component tests for UI components
- [ ] Test happy path scenarios
- [ ] Test error handling
- [ ] Test edge cases
- [ ] Test user interactions
- [ ] Verify tests pass: `npm test`
- [ ] Check coverage: `npm run test:coverage`

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check that the import path is correct and the file exists

**Issue**: "ReferenceError: document is not defined"
**Solution**: Ensure jest.config.js has `testEnvironment: 'jsdom'`

**Issue**: Async tests timeout
**Solution**: Increase timeout with `jest.setTimeout(10000)` or fix the async operation

**Issue**: Mock not working
**Solution**: Ensure mock is defined before the import of the module being tested

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Hooks](https://react-hooks-testing-library.com/)
- [Jest Expo Configuration](https://docs.expo.dev/guides/testing-with-jest/)

## CI/CD Integration

For continuous integration, use:

```bash
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage report
- Uses 2 workers for faster execution
- Exits with error code if tests fail

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:ci
```
