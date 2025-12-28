/**
 * Integration tests for AuthContext.
 *
 * Tests authentication state management and React hooks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/services/authService';
import { createMockJWT, mockUser } from '@/test/utils';
import { ReactNode } from 'react';

// Mock authService
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isOwner: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with no user and loading state', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isOwner).toBe(false);
    });

    it('should load user from getCurrentUser on mount', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockedAuthService.isOwner.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for user to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isOwner).toBe(true);
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledOnce();
    });

    it('should handle getCurrentUser error gracefully', async () => {
      mockedAuthService.getCurrentUser.mockRejectedValue(new Error('Auth error'));
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('login()', () => {
    it('should login successfully and update user state', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.login.mockResolvedValue({
        user: mockUser,
        error: null,
      });
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update mock to return true after login
      mockedAuthService.isOwner.mockReturnValue(true);

      // Perform login
      let loginResult: { error: string | null };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult!.error).toBeNull();

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isOwner).toBe(true);
      expect(mockedAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return error on failed login', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.login.mockResolvedValue({
        user: null,
        error: 'Invalid credentials',
      });
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { error: string | null };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult!.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
    });

    it('should handle login exception', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.login.mockRejectedValue(new Error('Network error'));
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { error: string | null };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult!.error).toBeDefined();
      expect(result.current.user).toBeNull();
    });

    it('should set loading state during login', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.isOwner.mockReturnValue(false);

      // Make login take some time
      mockedAuthService.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ user: mockUser, error: null }), 100);
          })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update mock to return true after login
      mockedAuthService.isOwner.mockReturnValue(true);

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('logout()', () => {
    it('should logout and clear user state', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockedAuthService.isOwner.mockReturnValue(true);
      mockedAuthService.logout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for user to load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Update mock to return false after logout
      mockedAuthService.isOwner.mockReturnValue(false);

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isOwner).toBe(false);
      expect(mockedAuthService.logout).toHaveBeenCalledOnce();
    });

    it('should clear user even if logout API fails', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockedAuthService.isOwner.mockReturnValue(true);
      mockedAuthService.logout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Update mock to return false after logout
      mockedAuthService.isOwner.mockReturnValue(false);

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('auth:unauthorized event', () => {
    it('should clear user on unauthorized event', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockedAuthService.isOwner.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Update mock to return false after unauthorized
      mockedAuthService.isOwner.mockReturnValue(false);

      // Dispatch unauthorized event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('useAuth() hook', () => {
    it('should throw error if used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('isOwner computed property', () => {
    it('should update isOwner when user changes', async () => {
      mockedAuthService.getCurrentUser.mockResolvedValue(null);
      mockedAuthService.login.mockResolvedValue({
        user: mockUser,
        error: null,
      });

      // Start with false, then change to true after login
      mockedAuthService.isOwner.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially no user, not owner
      expect(result.current.isOwner).toBe(false);

      // Update mock to return true for owner user
      mockedAuthService.isOwner.mockReturnValue(true);

      // Login as owner
      await act(async () => {
        await result.current.login('owner@example.com', 'password');
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isOwner).toBe(true);
    });
  });
});
