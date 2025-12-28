# Frontend-Backend API Integration - Summary

**Quick reference guide for the API integration plan**

## Overview

This document summarizes the comprehensive plan for integrating the React frontend with the real backend API.

**Full Plan**: See [API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md) for complete details.

---

## Current State

### Mock Services (6 files)
- `mockAuthService.ts` - Hardcoded credentials
- `mockBlogDatabase.ts` - In-memory blog posts
- `mockProjectsDatabase.ts` - In-memory projects
- `mockCertificationsDatabase.ts` - In-memory certifications
- `mockAnalyticsService.ts` - Simulated analytics
- `mockVisitorService.ts` - Simulated visitor tracking

### Current Limitations
- ❌ No real API calls
- ❌ Data lost on refresh
- ❌ No environment configuration
- ❌ React Query installed but not used
- ❌ No error handling
- ❌ No loading states

---

## Target State

### New Architecture

```
Components
    ↓
React Query Hooks (useAuth, useBlogPosts, etc.)
    ↓
Service Layer (authService, blogService, etc.)
    ↓
API Client (axios with interceptors)
    ↓
Backend API (api.patrickcmd.dev or api-dev.patrickcmd.dev)
```

### Key Features
- ✅ Real HTTP API calls with axios
- ✅ React Query for caching and state management
- ✅ Environment-specific API URLs (dev/prod/mock)
- ✅ JWT token management
- ✅ Proper error handling
- ✅ Loading states
- ✅ Type-safe TypeScript

---

## Environment Configuration

### API URLs

| Environment | API URL | Usage |
|-------------|---------|-------|
| **Production** | `https://api.patrickcmd.dev` | Live site |
| **Development** | `https://api-dev.patrickcmd.dev` | Local development with real API |
| **Mock** | `http://localhost:8080` | Offline development |

### Environment Variables

**`.env.development`**:
```bash
VITE_API_BASE_URL=https://api-dev.patrickcmd.dev
VITE_API_VERSION=v1
VITE_USE_MOCK_API=false
VITE_DEBUG_API_CALLS=true
```

**`.env.production`**:
```bash
VITE_API_BASE_URL=https://api.patrickcmd.dev
VITE_API_VERSION=v1
VITE_USE_MOCK_API=false
VITE_DEBUG_API_CALLS=false
```

**`.env.local`** (for offline development):
```bash
VITE_USE_MOCK_API=true
VITE_DEBUG_API_CALLS=true
```

### Testing Different Environments

```bash
# Development with real dev API
npm run dev

# Development with mock API (offline)
VITE_USE_MOCK_API=true npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Integration Phases

### Phase 1: Authentication (HIGHEST PRIORITY)
**Blocks all other integrations**

Files to create:
- `src/config/env.ts` - Environment configuration
- `src/types/api.ts` - API type definitions
- `src/lib/apiClient.ts` - Base HTTP client with interceptors
- `src/services/authService.ts` - Auth API service
- Update `src/contexts/AuthContext.tsx`

**API Endpoints**:
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

**Key Features**:
- JWT token storage in localStorage
- Automatic token injection via axios interceptors
- Automatic logout on 401 errors
- Fallback to mock API via `VITE_USE_MOCK_API` flag

### Phase 2: Blog Integration (HIGH PRIORITY)

Files to create:
- `src/types/blog.ts`
- `src/services/blogService.ts`
- `src/hooks/useBlogPosts.ts`
- Update `src/components/BlogTab.tsx`

**API Endpoints** (7 total):
- `GET /blog/posts` - List posts
- `POST /blog/posts` - Create post
- `GET /blog/posts/{id}` - Get single post
- `PUT /blog/posts/{id}` - Update post
- `DELETE /blog/posts/{id}` - Delete post
- `POST /blog/posts/{id}/publish` - Publish post
- `POST /blog/posts/{id}/unpublish` - Unpublish post

**React Query Benefits**:
- Automatic caching (5 min stale time)
- Loading states
- Error handling
- Optimistic updates
- Cache invalidation

### Phase 3: Projects Integration (MEDIUM PRIORITY)

Same structure as Blog Integration:
- `src/types/project.ts`
- `src/services/projectService.ts`
- `src/hooks/useProjects.ts`
- Update `src/components/ProjectsTab.tsx`

**API Endpoints**: 7 (same pattern as blogs)

### Phase 4: Certifications Integration (MEDIUM PRIORITY)

Same structure as Blog/Projects:
- `src/types/certification.ts`
- `src/services/certificationService.ts`
- `src/hooks/useCertifications.ts`
- Update `src/components/CertificationsTab.tsx`

**API Endpoints**: 7 (same pattern as blogs)

### Phase 5: Visitor & Analytics (LOW PRIORITY)

Files to create:
- `src/types/analytics.ts`
- `src/services/visitorService.ts`
- `src/services/analyticsService.ts`
- `src/hooks/useVisitorAnalytics.ts`
- Update `src/components/VisitorCounter.tsx`
- Update `src/components/DashboardTab.tsx`

**API Endpoints** (10 total):
- Visitor: 4 endpoints
- Analytics: 6 endpoints

**Session Deduplication**:
- Track visitor once per session (sessionStorage)
- Track content views once per session

---

## Key Implementation Patterns

### 1. Base API Client Pattern

```typescript
// src/lib/apiClient.ts
import axios from 'axios';
import { env } from '@/config/env';

const client = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
});

// Request interceptor - add auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on unauthorized
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
```

### 2. Service Layer Pattern

```typescript
// src/services/blogService.ts
import apiClient from '@/lib/apiClient';
import { env } from '@/config/env';
import { mockBlogDB } from './mockBlogDatabase';

class BlogService {
  async getAllPosts() {
    // Fallback to mock API
    if (env.useMockApi) {
      return mockBlogDB.getAllPosts();
    }

    // Real API call
    const response = await apiClient.get('/blog/posts');
    return response.data.posts;
  }

  // ... other methods
}

export const blogService = new BlogService();
```

### 3. React Query Hook Pattern

```typescript
// src/hooks/useBlogPosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blogService';

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blogs'],
    queryFn: () => blogService.getAllPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => blogService.createPost(data),
    onSuccess: () => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}
```

### 4. Component Usage Pattern

```typescript
// src/components/BlogTab.tsx
import { useBlogPosts, useDeleteBlogPost } from '@/hooks/useBlogPosts';

export function BlogTab() {
  const { data: posts = [], isLoading, error } = useBlogPosts();
  const deleteMutation = useDeleteBlogPost();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <button onClick={() => deleteMutation.mutate(post.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup codebase
- [ ] Create feature branch: `feature/api-integration`
- [ ] Install dependencies: `npm install axios`
- [ ] Set up environment files (`.env.development`, `.env.production`)
- [ ] Configure TypeScript types

### Phase 1: Auth
- [ ] Create env config
- [ ] Create API client
- [ ] Create auth service
- [ ] Update AuthContext
- [ ] Test login/logout
- [ ] Commit changes

### Phase 2: Blog
- [ ] Create blog types
- [ ] Create blog service
- [ ] Create React Query hooks
- [ ] Update BlogTab component
- [ ] Test CRUD operations
- [ ] Commit changes

### Phase 3: Projects
- [ ] Same as Phase 2 for projects
- [ ] Commit changes

### Phase 4: Certifications
- [ ] Same as Phase 2 for certifications
- [ ] Commit changes

### Phase 5: Analytics
- [ ] Create analytics services
- [ ] Create hooks
- [ ] Update VisitorCounter and DashboardTab
- [ ] Test tracking
- [ ] Commit changes

### Post-Migration
- [ ] Full end-to-end testing
- [ ] Production build test
- [ ] Update documentation
- [ ] Code review
- [ ] Deploy

---

## Testing Strategy

### Local Testing

1. **Mock API (Offline)**:
   ```bash
   VITE_USE_MOCK_API=true npm run dev
   ```
   - No network calls
   - Fast development
   - Works offline

2. **Dev API (Real Backend)**:
   ```bash
   npm run dev  # Uses .env.development
   ```
   - Real API calls to `api-dev.patrickcmd.dev`
   - Data persists in DynamoDB
   - Test with real Cognito

3. **Production Build**:
   ```bash
   npm run build
   npm run preview
   ```
   - Test production configuration
   - Verify environment variables
   - Check API calls use production URL

### Test Checklist Per Phase

For each integration phase, verify:
- [ ] API calls succeed
- [ ] Loading states display
- [ ] Error messages are clear
- [ ] Data updates immediately (cache invalidation)
- [ ] Mock API fallback works
- [ ] TypeScript types are correct
- [ ] No console errors

---

## Rollback Plan

### Quick Rollback
Toggle mock API flag:
```bash
VITE_USE_MOCK_API=true npm run dev
```

### Full Rollback
```bash
git log --oneline
git reset --hard <commit-before-integration>
npm run dev
```

### Per-Service Rollback
Each service has built-in fallback:
```typescript
if (env.useMockApi) {
  return mockService.method();
}
```

---

## Dependencies

```bash
# Required
npm install axios

# Already installed (verify version)
npm install @tanstack/react-query@latest

# Dev dependencies
npm install -D @types/node
```

---

## File Structure After Integration

```
frontend/src/
├── config/
│   └── env.ts                    # NEW: Environment config
│
├── types/
│   ├── api.ts                    # NEW: Common API types
│   ├── blog.ts                   # NEW: Blog types
│   ├── project.ts                # NEW: Project types
│   ├── certification.ts          # NEW: Certification types
│   └── analytics.ts              # NEW: Analytics types
│
├── lib/
│   ├── apiClient.ts              # NEW: Base HTTP client
│   └── utils.ts                  # Existing
│
├── services/
│   ├── authService.ts            # NEW: Auth API
│   ├── blogService.ts            # NEW: Blog API
│   ├── projectService.ts         # NEW: Project API
│   ├── certificationService.ts   # NEW: Certification API
│   ├── visitorService.ts         # NEW: Visitor API
│   ├── analyticsService.ts       # NEW: Analytics API
│   ├── mockAuthService.ts        # KEEP: Fallback
│   └── ... (other mock services) # KEEP: Fallback
│
├── hooks/
│   ├── useBlogPosts.ts           # NEW: Blog hooks
│   ├── useProjects.ts            # NEW: Project hooks
│   ├── useCertifications.ts      # NEW: Cert hooks
│   ├── useVisitorAnalytics.ts    # NEW: Analytics hooks
│   └── use-toast.ts              # Existing
│
└── components/
    ├── BlogTab.tsx               # UPDATED: Use hooks
    ├── ProjectsTab.tsx           # UPDATED: Use hooks
    └── ... (other components)    # UPDATED: Use hooks
```

---

## Success Criteria

✅ **Integration is successful when**:

1. Authentication works with real JWT tokens
2. All CRUD operations function correctly
3. Visitor tracking increments (once per session)
4. Analytics data displays in charts
5. Loading states are smooth
6. Errors provide clear feedback
7. Environment switching works (dev/prod/mock)
8. Performance < 2s initial load
9. No TypeScript errors
10. Production build succeeds

---

## Next Steps

1. ✅ Review integration plan
2. ⏳ Approve environment variables and API URLs
3. ⏳ Set up test credentials in dev Cognito
4. ⏳ Create feature branch
5. ⏳ Begin Phase 1 (Authentication)
6. ⏳ Iterate through remaining phases
7. ⏳ Document lessons learned

---

**Quick Start**: See [API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md) for detailed implementation instructions.

**Questions?** Refer to the full plan or ask for clarification before starting implementation.
