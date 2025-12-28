/**
 * Integration tests for authService.
 *
 * Tests authentication flow with mocked API client.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';
import { createMockJWT, mockUser } from '@/test/utils';
import type { AxiosResponse } from 'axios';

// Mock the apiClient module
vi.mock('@/lib/apiClient', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  };

  return {
    apiClient: {
      axios: mockAxiosInstance,
      setAuthTokens: vi.fn(),
      clearAuth: vi.fn(),
      isAuthenticated: vi.fn(),
      getStoredAccessToken: vi.fn(),
    },
    default: mockAxiosInstance,
  };
});

// Get the mocked apiClient
import { apiClient } from '@/lib/apiClient';
const mockedApiClient = vi.mocked(apiClient);

describe('authService', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('login()', () => {
    it('should login successfully with valid credentials', async () => {
      const mockIdToken = createMockJWT();
      const mockTokens = {
        access_token: 'test_access_token',
        id_token: mockIdToken,
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
      };

      // Mock successful login response
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockTokens,
        status: 200,
        statusText: 'OK',
      } as AxiosResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.error).toBeNull();
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.role).toBe('owner');

      // Verify setAuthTokens was called
      expect(mockedApiClient.setAuthTokens).toHaveBeenCalledWith(
        'test_access_token',
        mockIdToken,
        'test_refresh_token'
      );

      // Verify user is stored
      const storedUser = JSON.parse(localStorage.getItem('portfolio_auth_user')!);
      expect(storedUser.email).toBe('test@example.com');
    });

    it('should return error with invalid credentials', async () => {
      // Mock 401 error response
      const mockError = {
        response: {
          status: 401,
          data: {
            detail: 'Invalid email or password',
            error: 'INVALID_CREDENTIALS',
          },
        },
        detail: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS',
      };

      (mockedApiClient.axios.post as any).mockRejectedValue(mockError);

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid email or password');

      // Verify setAuthTokens was not called
      expect(mockedApiClient.setAuthTokens).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      (mockedApiClient.axios.post as any).mockRejectedValue(new Error('Network Error'));

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('logout()', () => {
    it('should clear auth data on logout', async () => {
      // Setup: user is logged in
      const mockIdToken = createMockJWT();
      localStorage.setItem('auth_id_token', mockIdToken);
      localStorage.setItem('auth_access_token', 'test_token');
      localStorage.setItem('portfolio_auth_user', JSON.stringify(mockUser));

      mockedApiClient.getStoredAccessToken.mockReturnValue('test_token');

      // Mock successful logout
      (mockedApiClient.axios.post as any).mockResolvedValue({
        status: 200,
        data: { message: 'Logged out successfully' },
      } as AxiosResponse);

      await authService.logout();

      // Verify clearAuth was called
      expect(mockedApiClient.clearAuth).toHaveBeenCalled();
    });

    it('should clear auth data even if API call fails', async () => {
      // Setup: user is logged in
      localStorage.setItem('auth_id_token', 'test_token');
      localStorage.setItem('auth_access_token', 'test_token');
      localStorage.setItem('portfolio_auth_user', JSON.stringify(mockUser));

      mockedApiClient.getStoredAccessToken.mockReturnValue('test_token');

      // Mock failed logout API call
      (mockedApiClient.axios.post as any).mockRejectedValue(new Error('Network Error'));

      await authService.logout();

      // Verify clearAuth was still called
      expect(mockedApiClient.clearAuth).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return user from /auth/me if token exists', async () => {
      // Setup: user is logged in
      const mockIdToken = createMockJWT();
      localStorage.setItem('auth_id_token', mockIdToken);
      localStorage.setItem('portfolio_auth_user', JSON.stringify(mockUser));

      // Mock isAuthenticated to return true
      mockedApiClient.isAuthenticated.mockReturnValue(true);

      // Mock /auth/me response
      (mockedApiClient.axios.get as any).mockResolvedValue({
        data: {
          sub: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          'custom:role': mockUser.role,
          email_verified: true,
        },
        status: 200,
      } as AxiosResponse);

      const user = await authService.getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.email).toBe(mockUser.email);
      expect(user?.role).toBe(mockUser.role);

      // Verify user was stored
      const storedUser = JSON.parse(localStorage.getItem('portfolio_auth_user')!);
      expect(storedUser.email).toBe(mockUser.email);
    });

    it('should return null if no token exists', async () => {
      // Ensure localStorage is cleared
      localStorage.clear();

      // Mock isAuthenticated to return false (no token)
      mockedApiClient.isAuthenticated.mockReturnValue(false);

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();

      // Verify /auth/me was not called
      expect(mockedApiClient.axios.get).not.toHaveBeenCalled();
    });

    it('should clear auth and return null if token is invalid', async () => {
      // Setup: invalid token
      localStorage.setItem('auth_id_token', 'invalid_token');
      localStorage.setItem('portfolio_auth_user', JSON.stringify(mockUser));

      // Mock isAuthenticated to return true (has token)
      mockedApiClient.isAuthenticated.mockReturnValue(true);

      // Mock 401 response
      (mockedApiClient.axios.get as any).mockRejectedValue({
        response: { status: 401 },
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();

      // Verify clearAuth was called
      expect(mockedApiClient.clearAuth).toHaveBeenCalled();
    });
  });

  describe('isOwner()', () => {
    it('should return true for owner role', () => {
      const ownerUser = { ...mockUser, role: 'owner' as const };

      expect(authService.isOwner(ownerUser)).toBe(true);
    });

    it('should return false for public role', () => {
      const publicUser = { ...mockUser, role: 'public' as const };

      expect(authService.isOwner(publicUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(authService.isOwner(null)).toBe(false);
    });
  });

  describe('refreshToken()', () => {
    it('should refresh tokens successfully', async () => {
      // Setup: existing tokens
      const oldIdToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 100 });
      localStorage.setItem('auth_id_token', oldIdToken);
      localStorage.setItem('auth_refresh_token', 'old_refresh_token');

      const newIdToken = createMockJWT();
      const mockNewTokens = {
        access_token: 'new_access_token',
        id_token: newIdToken,
        expires_in: 3600,
      };

      // Mock refresh response
      (mockedApiClient.axios.post as any).mockResolvedValue({
        data: mockNewTokens,
        status: 200,
      } as AxiosResponse);

      const success = await authService.refreshToken();

      expect(success).toBe(true);

      // Verify setAuthTokens was called with new tokens
      expect(mockedApiClient.setAuthTokens).toHaveBeenCalledWith(
        'new_access_token',
        newIdToken,
        'old_refresh_token'
      );
    });

    it('should clear auth if refresh fails', async () => {
      localStorage.setItem('auth_id_token', 'old_token');
      localStorage.setItem('auth_refresh_token', 'old_refresh_token');

      // Mock failed refresh
      (mockedApiClient.axios.post as any).mockRejectedValue({
        response: { status: 401 },
      });

      const success = await authService.refreshToken();

      expect(success).toBe(false);

      // Verify clearAuth was called
      expect(mockedApiClient.clearAuth).toHaveBeenCalled();
    });

    it('should return false if no refresh token exists', async () => {
      const success = await authService.refreshToken();

      expect(success).toBe(false);

      // Verify no API call was made
      expect(mockedApiClient.axios.post).not.toHaveBeenCalled();
    });
  });
});
