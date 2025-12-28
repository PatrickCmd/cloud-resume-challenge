/**
 * Authentication service for real backend API integration.
 *
 * Replaces mockAuthService with real Cognito authentication.
 * Maintains same interface for backward compatibility.
 */

import { apiClient } from '@/lib/apiClient';
import {
  LoginRequest,
  AuthTokens,
  RefreshTokenRequest,
  LogoutRequest,
  User,
  ApiError,
} from '@/types/api';
import { env } from '@/config/env';
import { mockAuthService, User as MockUser } from './mockAuthService';

const AUTH_STORAGE_KEY = 'portfolio_auth_user';

/**
 * Decode JWT token payload without verification.
 * Used to extract user info from ID token.
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    // Decode payload (add padding if needed)
    let payload = parts[1];
    payload += '='.repeat((4 - (payload.length % 4)) % 4);

    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Extract user information from Cognito ID token.
 */
function extractUserFromToken(idToken: string): User {
  const payload = decodeJwtPayload(idToken);

  if (!payload) {
    throw new Error('Failed to decode ID token');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    'cognito:username': payload['cognito:username'],
    'custom:role': payload['custom:role'] || 'public',
    email_verified: payload.email_verified,
    name: payload.name,
  };
}

/**
 * Convert backend User to mock User format for compatibility.
 */
function toMockUser(user: User): MockUser {
  return {
    id: user.sub,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: (user['custom:role'] || 'public') as 'owner' | 'public',
  };
}

class AuthService {
  /**
   * Login with email and password.
   * Returns user info or error.
   *
   * POST /auth/login
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: MockUser | null; error: string | null }> {
    // Use mock service if enabled
    if (env.useMockApi) {
      return mockAuthService.login(email, password);
    }

    try {
      // Real API call
      const response = await apiClient.axios.post<AuthTokens>('/auth/login', {
        email,
        password,
      } as LoginRequest);

      const tokens = response.data;

      // Store tokens
      apiClient.setAuthTokens(tokens.access_token, tokens.id_token, tokens.refresh_token);

      // Extract user info from ID token
      const user = extractUserFromToken(tokens.id_token);
      const mockUser = toMockUser(user);

      // Store user in localStorage for persistence
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

      return { user: mockUser, error: null };
    } catch (error: any) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.detail ||
        apiError.message ||
        apiError.error ||
        'Login failed. Please check your credentials.';

      return { user: null, error: errorMessage };
    }
  }

  /**
   * Logout current user.
   * Invalidates session on backend.
   *
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    if (env.useMockApi) {
      await mockAuthService.logout();
      return;
    }

    try {
      const accessToken = apiClient.getStoredAccessToken();

      if (accessToken) {
        // Call backend logout endpoint
        await apiClient.axios.post('/auth/logout', {
          access_token: accessToken,
        } as LogoutRequest);
      }
    } catch (error) {
      // Ignore logout errors - we'll clear local state anyway
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local auth state
      apiClient.clearAuth();
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  /**
   * Get current authenticated user.
   * Returns user from localStorage if available, otherwise fetches from API.
   *
   * GET /auth/me
   */
  async getCurrentUser(): Promise<MockUser | null> {
    if (env.useMockApi) {
      return mockAuthService.getCurrentUser();
    }

    // First check localStorage
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as MockUser;

        // Verify token is still valid by calling /auth/me
        if (apiClient.isAuthenticated()) {
          try {
            const response = await apiClient.axios.get<User>('/auth/me');
            const freshUser = toMockUser(response.data);

            // Update stored user with fresh data
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));

            return freshUser;
          } catch (error) {
            // Token expired or invalid - clear auth
            apiClient.clearAuth();
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
        }

        // No token but have stored user - token might have expired
        return null;
      } catch {
        return null;
      }
    }

    // No stored user - check if we have a valid token
    if (apiClient.isAuthenticated()) {
      try {
        const response = await apiClient.axios.get<User>('/auth/me');
        const user = toMockUser(response.data);

        // Store user
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

        return user;
      } catch (error) {
        // Token invalid - clear auth
        apiClient.clearAuth();
        return null;
      }
    }

    return null;
  }

  /**
   * Check if user has owner role.
   */
  isOwner(user: MockUser | null): boolean {
    return user?.role === 'owner';
  }

  /**
   * Refresh authentication token.
   * This is called automatically by apiClient, but exposed for manual use.
   *
   * POST /auth/refresh
   */
  async refreshToken(): Promise<boolean> {
    if (env.useMockApi) {
      return false;
    }

    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await apiClient.axios.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshToken,
      } as RefreshTokenRequest);

      const tokens = response.data;

      // Update tokens
      apiClient.setAuthTokens(tokens.access_token, tokens.id_token, refreshToken);

      // Update user info
      const user = extractUserFromToken(tokens.id_token);
      const mockUser = toMockUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

      return true;
    } catch (error) {
      // Refresh failed - clear auth
      apiClient.clearAuth();
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
