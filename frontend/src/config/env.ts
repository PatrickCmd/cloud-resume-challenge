/**
 * Environment configuration for API integration.
 *
 * Supports three modes:
 * - Production: Uses api.patrickcmd.dev
 * - Development: Uses api-dev.patrickcmd.dev
 * - Mock: Uses mock API services (for offline development)
 */

export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.patrickcmd.dev',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',

  // Feature Flags
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  enableVisitorTracking: import.meta.env.VITE_ENABLE_VISITOR_TRACKING !== 'false',

  // Debug
  debugApiCalls: import.meta.env.VITE_DEBUG_API_CALLS === 'true',

  // Computed values
  get apiUrl() {
    // Backend API doesn't use versioned paths, so just return base URL
    return this.apiBaseUrl;
  },

  get isDevelopment() {
    return import.meta.env.DEV;
  },

  get isProduction() {
    return import.meta.env.PROD;
  },
} as const;

// Type-safe environment
export type Env = typeof env;
