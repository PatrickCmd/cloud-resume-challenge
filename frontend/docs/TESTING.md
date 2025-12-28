# Frontend Testing Guide

**Cloud Resume Challenge - Frontend Testing Documentation**

## Overview

This document describes the testing setup and practices for the frontend application.

---

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **React Testing**: [@testing-library/react](https://testing-library.com/react) - React component testing utilities
- **User Interactions**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) - Simulates user interactions
- **DOM Assertions**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) - Custom jest matchers for DOM
- **Environment**: jsdom - Browser environment simulation

---

## Running Tests

### Watch Mode (Interactive)

```bash
npm test
```

Runs tests in watch mode. Tests automatically re-run when files change.

### Run Once (CI Mode)

```bash
npm run test:run
```

Runs all tests once and exits. Used in CI/CD pipelines.

### UI Mode (Visual Interface)

```bash
npm run test:ui
```

Opens Vitest UI in your browser for visual test running and debugging.

### Coverage Report

```bash
npm run test:coverage
```

Generates code coverage report in `/coverage` directory.

---

## Test Structure

### Directory Layout

```
src/
├── test/
│   ├── setup.ts                    # Global test setup
│   └── utils.tsx                   # Test utilities and helpers
├── services/
│   ├── authService.ts
│   └── __tests__/
│       └── authService.test.ts     # Service tests
├── contexts/
│   ├── AuthContext.tsx
│   └── __tests__/
│       └── AuthContext.test.tsx    # Context tests
└── components/
    ├── BlogTab.tsx
    └── __tests__/
        └── BlogTab.test.tsx        # Component tests
```

### Test File Naming

- Unit/Integration tests: `*.test.ts` or `*.test.tsx`
- Component tests: `*.test.tsx`
- Located in `__tests__/` folder next to source files

---

## Test Categories

### 1. Unit Tests (Services)

Test individual functions and modules in isolation.

**Example**: `authService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { authService } from '../authService';

describe('authService.login()', () => {
  it('should login successfully with valid credentials', async () => {
    const result = await authService.login('test@example.com', 'password');

    expect(result.user).toBeDefined();
    expect(result.error).toBeNull();
  });
});
```

**Coverage**:
- `src/services/__tests__/authService.test.ts` - Authentication service tests

### 2. Integration Tests (Context)

Test how multiple components work together.

**Example**: `AuthContext.test.tsx`

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../AuthContext';

describe('AuthContext', () => {
  it('should load user on mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

**Coverage**:
- `src/contexts/__tests__/AuthContext.test.tsx` - Authentication context tests

### 3. Component Tests

Test React components with user interactions.

**Example**: Component test structure

```typescript
import { render, screen, userEvent } from '@/test/utils';
import { BlogTab } from '../BlogTab';

describe('BlogTab', () => {
  it('should display blog posts', async () => {
    render(<BlogTab />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
    });
  });
});
```

---

## Test Utilities

### Custom Render Function

Use `renderWithProviders` for components that need context:

```typescript
import { renderWithProviders, screen } from '@/test/utils';

it('should render with auth context', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Auth State

```typescript
import { setupMockAuth } from '@/test/utils';

it('should show user as logged in', () => {
  const { mockUser } = setupMockAuth();

  renderWithProviders(<Dashboard />);
  expect(screen.getByText(mockUser.email)).toBeInTheDocument();
});
```

### Mock JWT Tokens

```typescript
import { createMockJWT } from '@/test/utils';

const mockToken = createMockJWT({
  sub: 'user-123',
  email: 'test@example.com',
  'custom:role': 'owner',
});
```

### User Interactions

```typescript
import { renderWithProviders, userEvent } from '@/test/utils';

it('should handle click events', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

  await user.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

---

## Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad** - Testing implementation details:
```typescript
expect(component.state.count).toBe(0);
```

✅ **Good** - Testing behavior:
```typescript
expect(screen.getByText('Count: 0')).toBeInTheDocument();
```

### 2. Use Accessible Queries

Prefer queries that match how users interact:

```typescript
// ✅ Good - Accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// ❌ Avoid - Implementation details
screen.getByTestId('submit-btn')
screen.getByClassName('email-input')
```

### 3. Cleanup Between Tests

The test setup automatically cleans up after each test:

```typescript
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
```

### 4. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');

// Mock specific module
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));
```

### 5. Test Async Operations

Use `waitFor` for async state updates:

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### 6. Test Error States

Always test error handling:

```typescript
it('should display error message on failure', async () => {
  mockAPI.get.mockRejectedValue(new Error('Network error'));

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

---

## Test Examples

### Example 1: Testing Login Flow

```typescript
describe('Login Flow', () => {
  it('should login user and redirect to dashboard', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginDialog />);

    // Fill in form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // Submit
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });
});
```

### Example 2: Testing Protected Component

```typescript
describe('Dashboard', () => {
  it('should show dashboard for logged in owner', () => {
    setupMockAuth(); // Sets up owner user

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should redirect if not owner', () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    renderWithProviders(<Dashboard />);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
```

### Example 3: Testing API Integration

```typescript
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('Blog Posts', () => {
  it('should fetch and display blog posts', async () => {
    renderWithProviders(<BlogTab />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('My First Post')).toBeInTheDocument();
      expect(screen.getByText('My Second Post')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    server.use(
      rest.get('/blogs', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<BlogTab />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## Mocking Strategies

### Mock API Calls with MSW (Mock Service Worker)

For future enhancement, consider using MSW for API mocking:

```bash
npm install -D msw
```

```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock_token',
        id_token: 'mock_id_token',
        refresh_token: 'mock_refresh',
        expires_in: 3600,
      })
    );
  }),
];
```

### Mock Environment Variables

```typescript
import { beforeEach } from 'vitest';

beforeEach(() => {
  import.meta.env.VITE_API_BASE_URL = 'http://localhost:3000';
  import.meta.env.VITE_USE_MOCK_API = 'true';
});
```

---

## Coverage Requirements

### Target Coverage

| Metric | Target |
|--------|--------|
| **Statements** | > 80% |
| **Branches** | > 75% |
| **Functions** | > 80% |
| **Lines** | > 80% |

### Viewing Coverage

After running `npm run test:coverage`:

```bash
# Open HTML coverage report
open coverage/index.html
```

### Coverage Exclusions

The following are excluded from coverage (see `vitest.config.ts`):
- `node_modules/`
- `src/test/` (test utilities)
- `**/*.d.ts` (type definitions)
- `**/*.config.*` (config files)
- `**/mockData*` (mock data)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console Debugging

```typescript
import { screen, debug } from '@testing-library/react';

it('should debug component', () => {
  render(<MyComponent />);

  // Print current DOM
  screen.debug();

  // Or debug specific element
  debug(screen.getByRole('button'));
});
```

### Test Isolation

Run single test file:

```bash
npm test authService.test.ts
```

Run specific test:

```bash
npm test -- -t "should login successfully"
```

---

## Common Issues & Solutions

### Issue: Tests timeout

**Solution**: Increase timeout for async operations

```typescript
it('should complete slow operation', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Issue: localStorage not cleared

**Solution**: Verify setup file runs

```typescript
// src/test/setup.ts
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### Issue: React Query stale data

**Solution**: Use fresh QueryClient per test

```typescript
const queryClient = createTestQueryClient();
renderWithProviders(<Component />, { queryClient });
```

---

## Future Enhancements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing with Percy or Chromatic
- [ ] Performance testing with Lighthouse CI
- [ ] Accessibility testing with axe-core
- [ ] API mocking with MSW
- [ ] Snapshot testing for components

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: 2025-12-28
