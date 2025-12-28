/**
 * Base API client for HTTP requests.
 *
 * Uses axios with interceptors for:
 * - Automatic JWT token injection
 * - Automatic token refresh on 401
 * - Error formatting
 * - Debug logging
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ApiError, NetworkError } from '@/types/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshingToken: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: env.apiUrl,
      timeout: 30000, // 30s for Lambda cold starts
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors.
   */
  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getIdToken();
        if (token && config.headers) {
          // Use ID token for authorization (contains custom:role claim)
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (env.debugApiCalls) {
          console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        if (env.debugApiCalls) {
          console.log('[API Response]', response.status, response.data);
        }
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const apiError = this.formatError(error);

        if (env.debugApiCalls) {
          console.error('[API Error]', apiError);
        }

        // Handle 401 - Token expired or invalid
        if (error.response?.status === 401) {
          // Don't try to refresh on login/refresh endpoints
          const isAuthEndpoint = error.config?.url?.includes('/auth/');

          if (!isAuthEndpoint) {
            // Try to refresh token
            const refreshed = await this.tryRefreshToken();

            if (refreshed && error.config) {
              // Retry original request with new token
              const token = this.getIdToken();
              if (token) {
                error.config.headers.Authorization = `Bearer ${token}`;
                return this.client.request(error.config);
              }
            }
          }

          // If refresh failed or not attempted, trigger logout
          this.handleUnauthorized();
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Try to refresh the authentication token.
   * Returns true if successful, false otherwise.
   */
  private async tryRefreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshingToken) {
      try {
        await this.refreshingToken;
        return true;
      } catch {
        return false;
      }
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.refreshingToken = (async () => {
      try {
        const response = await axios.post(
          `${env.apiUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 10000 }
        );

        const tokens = response.data;

        // Update stored tokens
        this.updateTokens(tokens.access_token, tokens.id_token);

        return tokens.id_token;
      } catch (error) {
        // Refresh failed - clear tokens
        this.clearAuth();
        throw error;
      } finally {
        this.refreshingToken = null;
      }
    })();

    try {
      await this.refreshingToken;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get ID token from localStorage.
   * ID token is used for authorization (contains custom:role claim).
   */
  private getIdToken(): string | null {
    return localStorage.getItem('auth_id_token');
  }

  /**
   * Get access token from localStorage.
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('auth_access_token');
  }

  /**
   * Get refresh token from localStorage.
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('auth_refresh_token');
  }

  /**
   * Update authentication tokens in localStorage.
   */
  private updateTokens(accessToken: string, idToken: string, refreshToken?: string) {
    localStorage.setItem('auth_access_token', accessToken);
    localStorage.setItem('auth_id_token', idToken);
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    }
  }

  /**
   * Remove all authentication tokens from localStorage.
   */
  private removeAuthTokens() {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_id_token');
    localStorage.removeItem('auth_refresh_token');
  }

  /**
   * Handle unauthorized error - Clear auth and notify app.
   */
  private handleUnauthorized() {
    // Clear auth state
    this.clearAuth();

    // Dispatch custom event to notify app (AuthContext can listen)
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  /**
   * Format axios error into consistent ApiError structure.
   */
  private formatError(error: AxiosError<ApiError>): ApiError | NetworkError {
    if (error.response?.data) {
      // Backend returned error response
      return error.response.data;
    }

    // Network error or no response
    return {
      error: error.code || 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
      statusCode: error.response?.status || 500,
    };
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get the axios instance for direct use.
   */
  get axios() {
    return this.client;
  }

  /**
   * Store authentication tokens after login.
   */
  setAuthTokens(accessToken: string, idToken: string, refreshToken: string) {
    this.updateTokens(accessToken, idToken, refreshToken);
  }

  /**
   * Get the current access token (for logout).
   */
  getStoredAccessToken(): string | null {
    return this.getAccessToken();
  }

  /**
   * Clear all authentication data.
   */
  clearAuth() {
    this.removeAuthTokens();
    localStorage.removeItem('portfolio_auth_user');
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.getIdToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export axios instance for convenience
export default apiClient.axios;
