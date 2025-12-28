/**
 * API type definitions for backend integration.
 *
 * Based on OpenAPI specification and backend E2E tests.
 */

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login request payload.
 * POST /auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response from backend.
 * Contains Cognito JWT tokens.
 *
 * Based on backend E2E test (test_auth_e2e.py):
 * - access_token: Used for API authorization
 * - id_token: Contains user claims (email, custom:role, etc.) - used for protected endpoints
 * - refresh_token: Used to get new access/id tokens
 * - expires_in: Token validity in seconds (typically 3600 = 1 hour)
 */
export interface AuthTokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Refresh token request payload.
 * POST /auth/refresh
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Refresh token response.
 * Returns new access_token and id_token (no new refresh_token).
 */
export interface RefreshTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
}

/**
 * Logout request payload.
 * POST /auth/logout
 */
export interface LogoutRequest {
  access_token: string;
}

/**
 * User information from JWT token.
 * GET /auth/me
 *
 * Decoded from Cognito ID token claims.
 */
export interface User {
  sub: string; // Cognito user ID
  email: string;
  'cognito:username'?: string;
  'custom:role'?: 'owner' | 'public';
  email_verified?: boolean;
  name?: string;
}

/**
 * Combined login response with user info.
 * Used by frontend after successful login.
 */
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * API error response structure.
 * Returned by backend on errors.
 */
export interface ApiError {
  detail?: string; // FastAPI validation error
  message?: string; // Custom error message
  error?: string; // Error type
  statusCode?: number; // HTTP status code
  details?: Record<string, any>; // Additional error details
}

/**
 * Network error (axios error without response).
 */
export interface NetworkError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================================================
// Generic API Response Types
// ============================================================================

/**
 * Generic paginated list response.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Generic success response.
 */
export interface SuccessResponse {
  message: string;
  success: boolean;
}
