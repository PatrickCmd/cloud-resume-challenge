# Frontend-Backend API Integration Plan

**Cloud Resume Challenge - Frontend Integration with Real Backend API**

## Table of Contents

- [Overview](#overview)
- [Current State Analysis](#current-state-analysis)
- [Integration Strategy](#integration-strategy)
- [Environment Configuration](#environment-configuration)
- [Phase 1: Authentication Integration](#phase-1-authentication-integration)
- [Phase 2: Blog Integration](#phase-2-blog-integration)
- [Phase 3: Projects Integration](#phase-3-projects-integration)
- [Phase 4: Certifications Integration](#phase-4-certifications-integration)
- [Phase 5: Visitor & Analytics Integration](#phase-5-visitor--analytics-integration)
- [Testing Strategy](#testing-strategy)
- [Migration Checklist](#migration-checklist)
- [Rollback Plan](#rollback-plan)

---

## Overview

This document outlines the step-by-step plan to migrate the frontend from mock API services to the real backend API deployed at:
- **Production**: `https://api.patrickcmd.dev`
- **Development**: `https://api-dev.patrickcmd.dev`

### Goals

1. Replace all mock services with real HTTP API calls
2. Maintain type safety with TypeScript
3. Support environment-specific API endpoints (dev/prod)
4. Implement proper error handling and loading states
5. Leverage React Query for efficient data fetching
6. Ensure backward compatibility during migration
7. Maintain existing UI/UX behavior

---

## Current State Analysis

### Existing Mock Services

| Service | File | Operations | Delay |
|---------|------|------------|-------|
| **Authentication** | `mockAuthService.ts` | login, logout, getCurrentUser | 100-500ms |
| **Blog Posts** | `mockBlogDatabase.ts` | CRUD + publish/unpublish | 30-200ms |
| **Projects** | `mockProjectsDatabase.ts` | CRUD + publish/unpublish | 30-200ms |
| **Certifications** | `mockCertificationsDatabase.ts` | CRUD + publish/unpublish | 30-200ms |
| **Analytics** | `mockAnalyticsService.ts` | track views, get stats | 30-100ms |
| **Visitor Tracking** | `mockVisitorService.ts` | track, count, trends | 50-100ms |

### Current Architecture Limitations

1. **No API client abstraction** - Services called directly in components
2. **No centralized error handling** - Each component handles errors independently
3. **No loading state management** - Manual `useState` for each operation
4. **No caching** - React Query installed but not utilized
5. **No environment configuration** - API URLs not configurable
6. **In-memory state** - Data lost on refresh
7. **Hardcoded credentials** - Mock auth uses `admin123` password

### API Specification Alignment

The backend API (OpenAPI 3.0.3) provides **34 endpoints** across 6 categories:
- Authentication: 3 endpoints
- Blog Posts: 7 endpoints
- Projects: 7 endpoints
- Certifications: 7 endpoints
- Visitor Tracking: 4 endpoints
- Analytics: 6 endpoints

**Type Compatibility**: Frontend types closely match backend OpenAPI schemas, requiring minimal adjustments.

---

## Integration Strategy

### Architectural Approach

We'll implement a **layered architecture** to ensure clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  Components (UI Layer)                                  │
│  - BlogTab.tsx, ProjectsTab.tsx, etc.                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  React Query Hooks (Data Layer)                         │
│  - useAuth(), useBlogPosts(), useProjects(), etc.      │
│  - Handles: caching, loading states, errors             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  API Service Layer (HTTP Client)                        │
│  - authService.ts, blogService.ts, etc.                │
│  - Handles: HTTP calls, auth headers, serialization    │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Base API Client (Axios/Fetch)                          │
│  - apiClient.ts                                         │
│  - Handles: base URL, interceptors, error formatting   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend API                                            │
│  - Production: api.patrickcmd.dev                       │
│  - Development: api-dev.patrickcmd.dev                  │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Use Axios** for HTTP client (better than fetch for interceptors, type safety)
2. **Leverage React Query** for all data fetching (already installed)
3. **Create service layer** matching mock service interfaces for easy migration
4. **Environment variables** for API URLs (Vite's `import.meta.env`)
5. **JWT token management** via Axios interceptors
6. **Gradual migration** - Replace one service at a time
7. **Feature flags** to toggle between mock and real API during development

---

## Environment Configuration

### 1. Environment Variables

**Create `.env` files** in frontend root:

#### `.env.development`
```bash
# Development API (local testing)
VITE_API_BASE_URL=https://api-dev.patrickcmd.dev
VITE_API_VERSION=v1
VITE_USE_MOCK_API=false

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_VISITOR_TRACKING=true

# Debug
VITE_DEBUG_API_CALLS=true
```

#### `.env.production`
```bash
# Production API
VITE_API_BASE_URL=https://api.patrickcmd.dev
VITE_API_VERSION=v1
VITE_USE_MOCK_API=false

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_VISITOR_TRACKING=true

# Debug
VITE_DEBUG_API_CALLS=false
```

#### `.env.local` (for local development with mock API)
```bash
# Override to use mock APIs
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK_API=true
VITE_DEBUG_API_CALLS=true
```

### 2. Environment Configuration File

**Create `frontend/src/config/env.ts`**:

```typescript
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
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',

  // Feature Flags
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  enableVisitorTracking: import.meta.env.VITE_ENABLE_VISITOR_TRACKING !== 'false',

  // Debug
  debugApiCalls: import.meta.env.VITE_DEBUG_API_CALLS === 'true',

  // Computed values
  get apiUrl() {
    return `${this.apiBaseUrl}/${this.apiVersion}`;
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
```

### 3. TypeScript Environment Types

**Update `frontend/vite-env.d.ts`**:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_VISITOR_TRACKING: string;
  readonly VITE_DEBUG_API_CALLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 4. Testing Different Environments

```bash
# Development with real dev API
npm run dev

# Development with mock API (offline)
VITE_USE_MOCK_API=true npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Phase 1: Authentication Integration

### Priority: HIGHEST (Blocks all other integrations)

### API Endpoints to Integrate

| Endpoint | Method | Mock Method | Description |
|----------|--------|-------------|-------------|
| `/auth/login` | POST | `login()` | User login with email/password |
| `/auth/logout` | POST | `logout()` | Invalidate session |
| `/auth/me` | GET | `getCurrentUser()` | Get current authenticated user |

### Implementation Steps

#### 1.1. Create Type Definitions

**File**: `frontend/src/types/api.ts`

```typescript
// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string; // JWT access token
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "public";
}

export interface AuthTokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

// Error Response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}
```

#### 1.2. Create Base API Client

**File**: `frontend/src/lib/apiClient.ts`

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ApiError } from '@/types/api';

class ApiClient {
  private client: AxiosInstance;

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

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (env.debugApiCalls) {
          console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Format errors
    this.client.interceptors.response.use(
      (response) => {
        if (env.debugApiCalls) {
          console.log('[API Response]', response.status, response.data);
        }
        return response;
      },
      (error: AxiosError<ApiError>) => {
        const apiError = this.formatError(error);

        if (env.debugApiCalls) {
          console.error('[API Error]', apiError);
        }

        // Handle 401 - Token expired
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(apiError);
      }
    );
  }

  private getAuthToken(): string | null {
    // Read from localStorage (set during login)
    return localStorage.getItem('auth_token');
  }

  private setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  private removeAuthToken() {
    localStorage.removeItem('auth_token');
  }

  private handleUnauthorized() {
    // Token expired or invalid - logout user
    this.removeAuthToken();
    localStorage.removeItem('portfolio_auth_user');

    // Redirect to login or show login dialog
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      error: error.code || 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
      statusCode: error.response?.status || 500,
    };
  }

  // Public methods
  get axios() {
    return this.client;
  }

  updateAuthToken(token: string) {
    this.setAuthToken(token);
  }

  clearAuth() {
    this.removeAuthToken();
  }
}

export const apiClient = new ApiClient();
export default apiClient.axios;
```

#### 1.3. Create Authentication Service

**File**: `frontend/src/services/authService.ts`

```typescript
import apiClient from '@/lib/apiClient';
import { LoginRequest, LoginResponse, User, AuthTokens } from '@/types/api';
import { env } from '@/config/env';

// Import mock service for fallback
import { mockAuthService } from './mockAuthService';

class AuthService {
  /**
   * Login with email and password.
   * Returns JWT tokens and user info.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Use mock service if enabled
    if (env.useMockApi) {
      const mockResult = await mockAuthService.login(email, password);
      if (!mockResult) {
        throw new Error('Invalid credentials');
      }
      return {
        user: mockResult,
        token: 'mock-jwt-token',
      };
    }

    // Real API call
    const response = await apiClient.post<AuthTokens>('/auth/login', {
      email,
      password,
    } as LoginRequest);

    const tokens = response.data;

    // Store ID token (used for API authentication)
    apiClient.updateAuthToken(tokens.id_token);

    // Get user info from /auth/me
    const user = await this.getCurrentUser();

    return {
      user,
      token: tokens.id_token,
    };
  }

  /**
   * Logout current user.
   * Invalidates session on backend.
   */
  async logout(): Promise<void> {
    if (env.useMockApi) {
      await mockAuthService.logout();
      return;
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear local auth state even if API call fails
      apiClient.clearAuth();
      localStorage.removeItem('portfolio_auth_user');
    }
  }

  /**
   * Get current authenticated user.
   * Uses JWT token from Authorization header.
   */
  async getCurrentUser(): Promise<User> {
    if (env.useMockApi) {
      const user = mockAuthService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      return user;
    }

    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }

  /**
   * Check if user has owner role.
   */
  isOwner(user: User | null): boolean {
    return user?.role === 'owner';
  }

  /**
   * Refresh authentication token.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (env.useMockApi) {
      throw new Error('Mock API does not support token refresh');
    }

    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const tokens = response.data;
    apiClient.updateAuthToken(tokens.id_token);

    return tokens;
  }
}

export const authService = new AuthService();
```

#### 1.4. Update AuthContext

**File**: `frontend/src/contexts/AuthContext.tsx`

Update to use new `authService` instead of `mockAuthService`:

```typescript
// Replace import
import { authService } from '@/services/authService';

// Update login function
const login = async (email: string, password: string) => {
  try {
    setIsLoading(true);
    const { user, token } = await authService.login(email, password);

    setUser(user);
    localStorage.setItem('portfolio_auth_user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Update logout function
const logout = async () => {
  try {
    await authService.logout();
  } finally {
    setUser(null);
    localStorage.removeItem('portfolio_auth_user');
    localStorage.removeItem('auth_token');
  }
};

// Update getCurrentUser on mount
useEffect(() => {
  const initAuth = async () => {
    const storedUser = localStorage.getItem('portfolio_auth_user');
    const token = localStorage.getItem('auth_token');

    if (storedUser && token) {
      try {
        // Verify token is still valid by fetching user
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch (error) {
        // Token expired or invalid - clear auth
        localStorage.removeItem('portfolio_auth_user');
        localStorage.removeItem('auth_token');
      }
    }

    setIsLoading(false);
  };

  initAuth();
}, []);
```

#### 1.5. Testing Authentication

**Manual Testing Steps**:

1. **Test Login**:
   ```typescript
   // In browser console
   const result = await authService.login('owner@patrickcmd.dev', 'YourPassword123!');
   console.log('Login result:', result);
   ```

2. **Test Token Persistence**:
   - Login
   - Refresh page
   - Verify user stays logged in

3. **Test Logout**:
   ```typescript
   await authService.logout();
   console.log('Token:', localStorage.getItem('auth_token')); // Should be null
   ```

4. **Test Unauthorized Handling**:
   - Manually set invalid token
   - Make authenticated request
   - Verify automatic logout

#### 1.6. Error Handling

Add error toast notifications in `LoginDialog.tsx`:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(email, password);
    onOpenChange(false); // Close dialog
    toast({
      title: "Login successful",
      description: `Welcome back, ${email}!`,
    });
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Login failed",
      description: error instanceof Error ? error.message : "Invalid credentials",
    });
  }
};
```

---

## Phase 2: Blog Integration

### Priority: HIGH

### API Endpoints to Integrate

| Endpoint | Method | Mock Method | Description |
|----------|--------|-------------|-------------|
| `/blog/posts` | GET | `getAllPosts()` | List published blog posts |
| `/blog/posts` | POST | `createPost()` | Create new post (owner) |
| `/blog/posts/{id}` | GET | `getPostById()` | Get single post |
| `/blog/posts/{id}` | PUT | `updatePost()` | Update post (owner) |
| `/blog/posts/{id}` | DELETE | `deletePost()` | Delete post (owner) |
| `/blog/posts/{id}/publish` | POST | `publishPost()` | Publish post (owner) |
| `/blog/posts/{id}/unpublish` | POST | `unpublishPost()` | Unpublish post (owner) |
| `/blog/categories` | GET | N/A | Get all categories |

### Implementation Steps

#### 2.1. Create Type Definitions

**File**: `frontend/src/types/blog.ts`

```typescript
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  publishedAt: string;
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostCreate {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
}

export interface BlogPostUpdate {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface BlogListParams {
  status?: "published" | "draft" | "all";
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}
```

#### 2.2. Create Blog Service

**File**: `frontend/src/services/blogService.ts`

```typescript
import apiClient from '@/lib/apiClient';
import {
  BlogPost,
  BlogPostCreate,
  BlogPostUpdate,
  BlogListResponse,
  BlogListParams
} from '@/types/blog';
import { env } from '@/config/env';
import { mockBlogDB } from './mockBlogDatabase';

class BlogService {
  async getAllPosts(params?: BlogListParams): Promise<BlogPost[]> {
    if (env.useMockApi) {
      return mockBlogDB.getAllPosts();
    }

    const response = await apiClient.get<BlogListResponse>('/blog/posts', {
      params,
    });

    return response.data.posts;
  }

  async getPostById(id: string): Promise<BlogPost | null> {
    if (env.useMockApi) {
      return mockBlogDB.getPostById(id);
    }

    try {
      const response = await apiClient.get<BlogPost>(`/blog/posts/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async createPost(data: BlogPostCreate): Promise<BlogPost> {
    if (env.useMockApi) {
      return mockBlogDB.createPost(data);
    }

    const response = await apiClient.post<BlogPost>('/blog/posts', data);
    return response.data;
  }

  async updatePost(id: string, data: BlogPostUpdate): Promise<BlogPost | null> {
    if (env.useMockApi) {
      return mockBlogDB.updatePost(id, data);
    }

    try {
      const response = await apiClient.put<BlogPost>(`/blog/posts/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    if (env.useMockApi) {
      return mockBlogDB.deletePost(id);
    }

    try {
      await apiClient.delete(`/blog/posts/${id}`);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async publishPost(id: string): Promise<BlogPost | null> {
    if (env.useMockApi) {
      return mockBlogDB.publishPost(id);
    }

    try {
      const response = await apiClient.post<BlogPost>(`/blog/posts/${id}/publish`);
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async unpublishPost(id: string): Promise<BlogPost | null> {
    if (env.useMockApi) {
      return mockBlogDB.unpublishPost(id);
    }

    try {
      const response = await apiClient.post<BlogPost>(`/blog/posts/${id}/unpublish`);
      return response.data;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    if (env.useMockApi) {
      // Extract unique categories from mock data
      const posts = await mockBlogDB.getAllPosts();
      return [...new Set(posts.map(p => p.category))];
    }

    const response = await apiClient.get<{ categories: string[] }>('/blog/categories');
    return response.data.categories;
  }
}

export const blogService = new BlogService();
```

#### 2.3. Create React Query Hooks

**File**: `frontend/src/hooks/useBlogPosts.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blogService';
import { BlogPostCreate, BlogPostUpdate, BlogListParams } from '@/types/blog';
import { toast } from '@/hooks/use-toast';

// Query keys
export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (params?: BlogListParams) => [...blogKeys.lists(), params] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
};

// List all blog posts
export function useBlogPosts(params?: BlogListParams) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogService.getAllPosts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single blog post
export function useBlogPost(id: string, enabled = true) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: () => blogService.getPostById(id),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Get categories
export function useBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: () => blogService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create blog post
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlogPostCreate) => blogService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast({
        title: "Blog post created",
        description: "Your post has been created as a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create post",
        description: error.message,
      });
    },
  });
}

// Update blog post
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BlogPostUpdate }) =>
      blogService.updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast({
        title: "Blog post updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update post",
        description: error.message,
      });
    },
  });
}

// Delete blog post
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast({
        title: "Blog post deleted",
        description: "The post has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete post",
        description: error.message,
      });
    },
  });
}

// Publish blog post
export function usePublishBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.publishPost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast({
        title: "Blog post published",
        description: "Your post is now visible to everyone.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to publish post",
        description: error.message,
      });
    },
  });
}

// Unpublish blog post
export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.unpublishPost(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      toast({
        title: "Blog post unpublished",
        description: "Your post is now a draft.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unpublish post",
        description: error.message,
      });
    },
  });
}
```

#### 2.4. Update BlogTab Component

**File**: `frontend/src/components/BlogTab.tsx`

Replace direct `mockBlogDB` calls with React Query hooks:

```typescript
import { useBlogPosts, useDeleteBlogPost, usePublishBlogPost } from '@/hooks/useBlogPosts';

export function BlogTab() {
  const { data: posts = [], isLoading, error } = useBlogPosts();
  const deleteMutation = useDeleteBlogPost();
  const publishMutation = usePublishBlogPost();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handlePublish = async (id: string) => {
    await publishMutation.mutateAsync(id);
  };

  if (isLoading) {
    return <div>Loading blog posts...</div>;
  }

  if (error) {
    return <div>Error loading posts: {error.message}</div>;
  }

  return (
    <div>
      {/* Render posts */}
      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <button onClick={() => handleDelete(post.id)}>Delete</button>
          <button onClick={() => handlePublish(post.id)}>Publish</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Phase 3: Projects Integration

### Priority: MEDIUM

Similar structure to Blog Integration. Key differences:
- Projects have `githubUrl`, `liveUrl`, `imageUrl` fields
- Projects have `featured` boolean flag
- Projects use `/projects` endpoints

**Implementation follows same pattern as Phase 2**:
1. Create `frontend/src/types/project.ts`
2. Create `frontend/src/services/projectService.ts`
3. Create `frontend/src/hooks/useProjects.ts`
4. Update `frontend/src/components/ProjectsTab.tsx`

---

## Phase 4: Certifications Integration

### Priority: MEDIUM

Similar structure to Blog/Projects Integration. Key differences:
- Certifications have `issuer`, `icon`, `credentialUrl`, `dateEarned` fields
- Certifications have `type: "certification" | "course"`
- Certifications use `/certifications` endpoints

**Implementation follows same pattern as Phase 2**:
1. Create `frontend/src/types/certification.ts`
2. Create `frontend/src/services/certificationService.ts`
3. Create `frontend/src/hooks/useCertifications.ts`
4. Update `frontend/src/components/CertificationsTab.tsx`

---

## Phase 5: Visitor & Analytics Integration

### Priority: LOW (Dashboard features)

### API Endpoints to Integrate

**Visitor Tracking**:
- `POST /visitors/track` - Track visitor
- `GET /visitors/count` - Get total count
- `GET /visitors/trends/daily` - Daily trends (owner only)
- `GET /visitors/trends/monthly` - Monthly trends (owner only)

**Analytics**:
- `POST /analytics/track` - Track content view
- `GET /analytics/views/{contentType}/{contentId}` - Get view count
- `GET /analytics/views/{contentType}` - Get all view stats (owner only)
- `GET /analytics/top-content` - Top content (owner only)
- `GET /analytics/total-views` - Total views (owner only)

### Implementation Steps

#### 5.1. Create Type Definitions

**File**: `frontend/src/types/analytics.ts`

```typescript
export interface VisitorCount {
  count: number;
  tracked?: boolean; // Whether this visit was counted
}

export interface DailyVisitors {
  date: string; // "Dec 16"
  visitors: number;
}

export interface MonthlyVisitors {
  month: string; // "Dec"
  visitors: number;
}

export interface ContentViewStat {
  contentId: string;
  views: number;
}

export interface TopContentStats {
  blogs: ContentViewStat[];
  projects: ContentViewStat[];
  certifications: ContentViewStat[];
}

export interface ViewStatsMap {
  [contentId: string]: number;
}

export type ContentType = "blog" | "project" | "certification";
```

#### 5.2. Create Visitor Service

**File**: `frontend/src/services/visitorService.ts`

```typescript
import apiClient from '@/lib/apiClient';
import { VisitorCount, DailyVisitors, MonthlyVisitors } from '@/types/analytics';
import { env } from '@/config/env';
import { mockVisitorService } from './mockVisitorService';

class VisitorService {
  async trackVisitor(): Promise<VisitorCount> {
    if (env.useMockApi) {
      return mockVisitorService.trackVisitor();
    }

    // Check if already tracked in this session
    const tracked = sessionStorage.getItem('visitor_tracked');
    if (tracked) {
      return {
        count: parseInt(tracked, 10),
        tracked: false,
      };
    }

    const response = await apiClient.post<VisitorCount>('/visitors/track');

    // Store in session to prevent duplicate tracking
    sessionStorage.setItem('visitor_tracked', response.data.count.toString());

    return response.data;
  }

  async getVisitorCount(): Promise<number> {
    if (env.useMockApi) {
      return mockVisitorService.getVisitorCount();
    }

    const response = await apiClient.get<VisitorCount>('/visitors/count');
    return response.data.count;
  }

  async getDailyTrends(days = 30): Promise<DailyVisitors[]> {
    if (env.useMockApi) {
      return mockVisitorService.getDailyTrends(days);
    }

    const response = await apiClient.get<{ trends: DailyVisitors[] }>(
      '/visitors/trends/daily',
      { params: { days } }
    );

    return response.data.trends;
  }

  async getMonthlyTrends(months = 6): Promise<MonthlyVisitors[]> {
    if (env.useMockApi) {
      return mockVisitorService.getMonthlyTrends(months);
    }

    const response = await apiClient.get<{ trends: MonthlyVisitors[] }>(
      '/visitors/trends/monthly',
      { params: { months } }
    );

    return response.data.trends;
  }
}

export const visitorService = new VisitorService();
```

#### 5.3. Create Analytics Service

**File**: `frontend/src/services/analyticsService.ts`

```typescript
import apiClient from '@/lib/apiClient';
import {
  ContentViewStat,
  TopContentStats,
  ViewStatsMap,
  ContentType
} from '@/types/analytics';
import { env } from '@/config/env';
import { mockAnalyticsService } from './mockAnalyticsService';

class AnalyticsService {
  async trackContentView(contentId: string, contentType: ContentType): Promise<number> {
    if (env.useMockApi) {
      return mockAnalyticsService.trackContentView(contentId, contentType);
    }

    // Check if already tracked in this session
    const viewKey = `viewed_${contentType}_${contentId}`;
    const tracked = sessionStorage.getItem(viewKey);

    if (tracked) {
      return parseInt(tracked, 10);
    }

    const response = await apiClient.post<{ views: number; tracked: boolean }>(
      '/analytics/track',
      { contentId, contentType }
    );

    // Store in session to prevent duplicate tracking
    sessionStorage.setItem(viewKey, response.data.views.toString());

    return response.data.views;
  }

  async getContentViews(contentId: string, contentType: ContentType): Promise<number> {
    if (env.useMockApi) {
      const stats = await mockAnalyticsService.getContentViewStats(contentId, contentType);
      return stats.views;
    }

    const response = await apiClient.get<{ views: number }>(
      `/analytics/views/${contentType}/${contentId}`
    );

    return response.data.views;
  }

  async getAllViewStats(contentType: ContentType): Promise<ViewStatsMap> {
    if (env.useMockApi) {
      return mockAnalyticsService.getAllViewStats(contentType);
    }

    const response = await apiClient.get<{ stats: ViewStatsMap }>(
      `/analytics/views/${contentType}`
    );

    return response.data.stats;
  }

  async getTopContent(limit = 5): Promise<TopContentStats> {
    if (env.useMockApi) {
      return mockAnalyticsService.getTopContent(limit);
    }

    const response = await apiClient.get<TopContentStats>(
      '/analytics/top-content',
      { params: { limit } }
    );

    return response.data;
  }

  async getTotalViews(): Promise<number> {
    if (env.useMockApi) {
      return mockAnalyticsService.getTotalViews();
    }

    const response = await apiClient.get<{ totalViews: number }>(
      '/analytics/total-views'
    );

    return response.data.totalViews;
  }
}

export const analyticsService = new AnalyticsService();
```

#### 5.4. Create React Query Hooks

**File**: `frontend/src/hooks/useVisitorAnalytics.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '@/services/visitorService';
import { analyticsService } from '@/services/analyticsService';
import { ContentType } from '@/types/analytics';

// Visitor tracking
export function useTrackVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => visitorService.trackVisitor(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor', 'count'] });
    },
  });
}

export function useVisitorCount() {
  return useQuery({
    queryKey: ['visitor', 'count'],
    queryFn: () => visitorService.getVisitorCount(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useVisitorDailyTrends(days = 30) {
  return useQuery({
    queryKey: ['visitor', 'trends', 'daily', days],
    queryFn: () => visitorService.getDailyTrends(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVisitorMonthlyTrends(months = 6) {
  return useQuery({
    queryKey: ['visitor', 'trends', 'monthly', months],
    queryFn: () => visitorService.getMonthlyTrends(months),
    staleTime: 5 * 60 * 1000,
  });
}

// Analytics
export function useTrackContentView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, contentType }: { contentId: string; contentType: ContentType }) =>
      analyticsService.trackContentView(contentId, contentType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['analytics', 'views', variables.contentType]
      });
    },
  });
}

export function useContentViews(contentId: string, contentType: ContentType) {
  return useQuery({
    queryKey: ['analytics', 'views', contentType, contentId],
    queryFn: () => analyticsService.getContentViews(contentId, contentType),
    staleTime: 1 * 60 * 1000,
  });
}

export function useAllViewStats(contentType: ContentType) {
  return useQuery({
    queryKey: ['analytics', 'stats', contentType],
    queryFn: () => analyticsService.getAllViewStats(contentType),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTopContent(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'top-content', limit],
    queryFn: () => analyticsService.getTopContent(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTotalViews() {
  return useQuery({
    queryKey: ['analytics', 'total-views'],
    queryFn: () => analyticsService.getTotalViews(),
    staleTime: 2 * 60 * 1000,
  });
}
```

#### 5.5. Update Components

**VisitorCounter.tsx**:
```typescript
import { useVisitorCount, useTrackVisitor } from '@/hooks/useVisitorAnalytics';

export function VisitorCounter() {
  const { data: count = 0, isLoading } = useVisitorCount();
  const trackMutation = useTrackVisitor();

  useEffect(() => {
    // Track visitor on mount
    trackMutation.mutate();
  }, []);

  return (
    <div>
      <span>{isLoading ? '...' : count.toLocaleString()}</span> visitors
    </div>
  );
}
```

**DashboardTab.tsx** (for analytics charts):
```typescript
import {
  useVisitorDailyTrends,
  useTopContent,
  useTotalViews
} from '@/hooks/useVisitorAnalytics';

export function DashboardTab() {
  const { data: dailyTrends = [], isLoading: trendsLoading } = useVisitorDailyTrends(30);
  const { data: topContent, isLoading: topLoading } = useTopContent(5);
  const { data: totalViews = 0 } = useTotalViews();

  // Render charts with data
  return (
    <div>
      {/* Visitor trend chart */}
      {/* Top content list */}
      {/* Total views display */}
    </div>
  );
}
```

---

## Testing Strategy

### Local Testing Workflow

#### 1. Test with Mock API (Offline Development)

```bash
# .env.local
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:8080
VITE_DEBUG_API_CALLS=true

npm run dev
```

**Verify**:
- Mock services are used
- No network requests to backend
- Console logs show `[Using Mock API]`

#### 2. Test with Development API

```bash
# .env.development
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://api-dev.patrickcmd.dev
VITE_DEBUG_API_CALLS=true

npm run dev
```

**Verify**:
- Network requests go to `api-dev.patrickcmd.dev`
- Console shows `[API Request]` and `[API Response]` logs
- Authentication works with real Cognito
- Data persists in DynamoDB

#### 3. Test Production Build Locally

```bash
npm run build
npm run preview
```

**Verify**:
- Build succeeds without errors
- Environment variables are correctly replaced
- API calls use production URL
- No debug logs in console

### Integration Testing Checklist

For each phase, test:

**Authentication (Phase 1)**:
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Token persistence across page refreshes
- [ ] Logout clears token
- [ ] Unauthorized requests trigger logout
- [ ] Protected routes require authentication

**Blog/Projects/Certifications (Phases 2-4)**:
- [ ] List items (public access)
- [ ] Get single item (public access)
- [ ] Create item (requires auth)
- [ ] Update item (requires auth)
- [ ] Delete item (requires auth)
- [ ] Publish/unpublish (requires auth)
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Data updates reflect immediately (cache invalidation)

**Analytics (Phase 5)**:
- [ ] Visitor counter increments
- [ ] Visitor tracking doesn't duplicate in same session
- [ ] Content view tracking works
- [ ] View counts display correctly
- [ ] Dashboard charts load with real data
- [ ] Owner-only endpoints require authentication

### Performance Testing

Monitor:
- **Initial page load**: < 2 seconds
- **API response time**: < 500ms (dev API may be slower due to Lambda cold starts)
- **Time to interactive**: < 3 seconds
- **React Query cache hits**: Should reduce redundant API calls

Use Chrome DevTools > Network tab and Performance tab.

---

## Migration Checklist

### Pre-Migration

- [ ] Backup current codebase
- [ ] Document current mock service behavior
- [ ] Create feature branch: `git checkout -b feature/api-integration`
- [ ] Install dependencies: `npm install axios @tanstack/react-query`
- [ ] Set up environment variables (`.env.development`, `.env.production`)
- [ ] Configure TypeScript types (`vite-env.d.ts`)

### Phase 1: Authentication

- [ ] Create `src/config/env.ts`
- [ ] Create `src/types/api.ts`
- [ ] Create `src/lib/apiClient.ts`
- [ ] Create `src/services/authService.ts`
- [ ] Update `src/contexts/AuthContext.tsx`
- [ ] Update `src/components/LoginDialog.tsx`
- [ ] Test login flow with dev API
- [ ] Test logout flow
- [ ] Test token persistence
- [ ] Commit: `git commit -m "feat: integrate authentication API"`

### Phase 2: Blog

- [ ] Create `src/types/blog.ts`
- [ ] Create `src/services/blogService.ts`
- [ ] Create `src/hooks/useBlogPosts.ts`
- [ ] Update `src/components/BlogTab.tsx`
- [ ] Test all CRUD operations
- [ ] Test publish/unpublish
- [ ] Test error handling
- [ ] Commit: `git commit -m "feat: integrate blog API"`

### Phase 3: Projects

- [ ] Create `src/types/project.ts`
- [ ] Create `src/services/projectService.ts`
- [ ] Create `src/hooks/useProjects.ts`
- [ ] Update `src/components/ProjectsTab.tsx`
- [ ] Test all operations
- [ ] Commit: `git commit -m "feat: integrate projects API"`

### Phase 4: Certifications

- [ ] Create `src/types/certification.ts`
- [ ] Create `src/services/certificationService.ts`
- [ ] Create `src/hooks/useCertifications.ts`
- [ ] Update `src/components/CertificationsTab.tsx`
- [ ] Test all operations
- [ ] Commit: `git commit -m "feat: integrate certifications API"`

### Phase 5: Analytics

- [ ] Create `src/types/analytics.ts`
- [ ] Create `src/services/visitorService.ts`
- [ ] Create `src/services/analyticsService.ts`
- [ ] Create `src/hooks/useVisitorAnalytics.ts`
- [ ] Update `src/components/VisitorCounter.tsx`
- [ ] Update `src/components/DashboardTab.tsx`
- [ ] Test visitor tracking
- [ ] Test analytics data
- [ ] Commit: `git commit -m "feat: integrate visitor and analytics API"`

### Post-Migration

- [ ] Run full test suite: `npm run test` (if tests exist)
- [ ] Build production bundle: `npm run build`
- [ ] Preview production build: `npm run preview`
- [ ] Test all features end-to-end
- [ ] Update documentation in `frontend/README.md`
- [ ] Remove or archive mock service files
- [ ] Create pull request
- [ ] Code review
- [ ] Deploy to production

---

## Rollback Plan

If issues arise during migration:

### Quick Rollback (Within Same Phase)

1. **Toggle back to mock API**:
   ```bash
   # .env.local
   VITE_USE_MOCK_API=true
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Full Rollback (Revert Integration)

1. **Revert git commits**:
   ```bash
   git log --oneline  # Find commit before integration
   git reset --hard <commit-hash>
   ```

2. **Verify mock services work**:
   ```bash
   npm run dev
   ```

3. **Investigate issues** before retrying integration

### Partial Rollback (Per Service)

Each service has fallback to mock API via `env.useMockApi` flag:

```typescript
// In any service
if (env.useMockApi) {
  return mockService.method();
}
```

Toggle per-service:
```typescript
// Temporarily disable specific service
const useMockBlog = true; // Override
if (useMockBlog || env.useMockApi) {
  return mockBlogDB.getAllPosts();
}
```

---

## Dependencies to Install

```bash
cd frontend

# HTTP client
npm install axios

# React Query (already installed, verify version)
npm install @tanstack/react-query@latest

# Dev dependencies
npm install -D @types/node  # For path resolution in vite.config.ts
```

---

## File Structure After Integration

```
frontend/
├── .env.development          # Dev API config
├── .env.production           # Prod API config
├── .env.local               # Local overrides (gitignored)
├── src/
│   ├── config/
│   │   └── env.ts           # Environment configuration
│   │
│   ├── types/
│   │   ├── api.ts           # Common API types
│   │   ├── blog.ts          # Blog types
│   │   ├── project.ts       # Project types
│   │   ├── certification.ts # Certification types
│   │   └── analytics.ts     # Analytics types
│   │
│   ├── lib/
│   │   ├── apiClient.ts     # Base HTTP client
│   │   └── utils.ts         # Existing utilities
│   │
│   ├── services/
│   │   ├── authService.ts        # Auth API service
│   │   ├── blogService.ts        # Blog API service
│   │   ├── projectService.ts     # Project API service
│   │   ├── certificationService.ts
│   │   ├── visitorService.ts
│   │   ├── analyticsService.ts
│   │   ├── mockAuthService.ts    # Keep for fallback
│   │   ├── mockBlogDatabase.ts   # Keep for fallback
│   │   └── ... (other mock services)
│   │
│   ├── hooks/
│   │   ├── useBlogPosts.ts       # Blog React Query hooks
│   │   ├── useProjects.ts        # Project React Query hooks
│   │   ├── useCertifications.ts  # Cert React Query hooks
│   │   ├── useVisitorAnalytics.ts
│   │   └── use-toast.ts          # Existing
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # Updated with real API
│   │
│   ├── components/
│   │   ├── BlogTab.tsx           # Updated with hooks
│   │   ├── ProjectsTab.tsx       # Updated with hooks
│   │   ├── CertificationsTab.tsx # Updated with hooks
│   │   ├── DashboardTab.tsx      # Updated with analytics
│   │   ├── VisitorCounter.tsx    # Updated with hooks
│   │   └── LoginDialog.tsx       # Updated error handling
│   │
│   └── App.tsx                   # Already has QueryClientProvider
│
└── docs/
    ├── API_INTEGRATION_PLAN.md   # This document
    └── TESTING.md               # Testing guide (to be created)
```

---

## Success Criteria

The integration is considered successful when:

1. **Authentication works** with real Cognito JWT tokens
2. **All CRUD operations** function correctly for blogs, projects, certifications
3. **Visitor tracking** increments correctly (once per session)
4. **Analytics data** displays in dashboard charts
5. **Loading states** are smooth and informative
6. **Error handling** provides clear user feedback
7. **Environment switching** works (dev/prod/mock)
8. **Performance** meets targets (< 2s initial load)
9. **Type safety** maintained throughout (no TypeScript errors)
10. **Production build** succeeds without warnings

---

## Next Steps After Plan Approval

1. **Review this plan** with team/stakeholders
2. **Approve environment variable names** and API URLs
3. **Set up test credentials** in development Cognito User Pool
4. **Create feature branch**: `feature/api-integration`
5. **Begin Phase 1**: Authentication integration
6. **Iterate through phases** one at a time
7. **Document lessons learned** in `frontend/docs/LESSONS_LEARNED.md`

---

## Additional Documentation to Create

After completing integration:

1. **`frontend/docs/TESTING.md`** - Testing guide for real API
2. **`frontend/docs/ENVIRONMENT_SETUP.md`** - Environment variable guide
3. **`frontend/docs/DEPLOYMENT.md`** - Deployment process
4. **`frontend/docs/TROUBLESHOOTING.md`** - Common issues and solutions
5. **Update `frontend/README.md`** - Reflect API integration

---

## Questions for Clarification

Before proceeding with implementation:

1. **Production credentials**: Who has access to production Cognito User Pool?
2. **Development environment**: Is `api-dev.patrickcmd.dev` currently deployed?
3. **Test data**: Should we populate dev API with seed data for testing?
4. **Error monitoring**: Should we integrate Sentry or similar for error tracking?
5. **Analytics**: Should we add Google Analytics or similar for frontend tracking?

---

**Document Version**: 1.0
**Created**: 2025-12-28
**Author**: Claude Code (AI Assistant)
**Status**: Draft - Awaiting Approval
