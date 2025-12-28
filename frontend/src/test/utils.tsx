/**
 * Test utilities and helpers.
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Create a new QueryClient for tests.
 * Each test gets a fresh client to avoid state pollution.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: 0, // Don't cache query results
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function that wraps components with necessary providers.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  withAuth?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    withAuth = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = withAuth ? <AuthProvider>{children}</AuthProvider> : children;

    return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Wait for a condition to be true.
 * Useful for waiting for async state updates.
 */
export async function waitFor(
  condition: () => boolean,
  { timeout = 5000, interval = 50 } = {}
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Mock successful login response.
 */
export const mockLoginSuccess = {
  access_token: 'mock_access_token',
  id_token: 'mock_id_token',
  refresh_token: 'mock_refresh_token',
  expires_in: 3600,
};

/**
 * Mock user object.
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'owner' as const,
};

/**
 * Mock JWT token with user claims.
 */
export function createMockJWT(claims: Record<string, any> = {}) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    'custom:role': 'owner',
    email_verified: true,
    name: 'Test User',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...claims,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  // Mock JWT (not cryptographically valid, just for testing)
  return `${encodedHeader}.${encodedPayload}.mock_signature`;
}

/**
 * Set up mock auth state in localStorage.
 */
export function setupMockAuth() {
  const mockIdToken = createMockJWT();

  localStorage.setItem('auth_id_token', mockIdToken);
  localStorage.setItem('auth_access_token', 'mock_access_token');
  localStorage.setItem('auth_refresh_token', 'mock_refresh_token');
  localStorage.setItem('portfolio_auth_user', JSON.stringify(mockUser));

  return { mockIdToken, mockUser };
}

/**
 * Clear auth state from localStorage.
 */
export function clearMockAuth() {
  localStorage.removeItem('auth_id_token');
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('portfolio_auth_user');
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
