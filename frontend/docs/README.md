# Frontend Documentation

**Cloud Resume Challenge - Frontend Integration Documentation**

This directory contains comprehensive documentation for integrating the React frontend with the real backend API.

---

## Documentation Index

### 📋 Planning Documents

#### 1. [API Integration Plan](./API_INTEGRATION_PLAN.md) ⭐
**Comprehensive step-by-step plan for API integration**

- Full integration strategy and architecture
- Environment configuration (dev/prod/mock)
- Detailed implementation for all 5 phases:
  - Phase 1: Authentication (HIGHEST PRIORITY)
  - Phase 2: Blog Integration
  - Phase 3: Projects Integration
  - Phase 4: Certifications Integration
  - Phase 5: Visitor & Analytics Integration
- Code examples and patterns
- Testing strategy
- Migration checklist
- Rollback plan

**Read this first** for complete implementation details.

---

#### 2. [Integration Summary](./INTEGRATION_SUMMARY.md)
**Quick reference guide**

- Current vs. target state
- Environment configuration
- Integration phases overview
- Key implementation patterns
- Migration checklist
- Success criteria

**Use this** for a quick overview and reference during implementation.

---

#### 3. [Architecture Diagrams](./ARCHITECTURE.md)
**Visual architecture guide**

- Current architecture (mock services)
- Target architecture (real API)
- Authentication flow diagram
- Data fetching flow diagram
- Error handling flow diagram
- Environment switching diagram
- Benefits of new architecture

**Refer to this** for understanding the overall system design.

---

## Quick Start

### For Developers Starting Integration

1. **Read**: [API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md) - Section "Overview" and "Integration Strategy"
2. **Review**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand current vs. target architecture
3. **Setup**: Follow "Environment Configuration" section in integration plan
4. **Implement**: Start with Phase 1 (Authentication) from the integration plan
5. **Test**: Follow "Testing Strategy" section for each phase
6. **Reference**: Use [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) as quick lookup

---

## Current State (Before Integration)

### Mock Services
The frontend currently uses 6 mock services:
- `mockAuthService.ts` - Simulated authentication
- `mockBlogDatabase.ts` - In-memory blog posts
- `mockProjectsDatabase.ts` - In-memory projects
- `mockCertificationsDatabase.ts` - In-memory certifications
- `mockAnalyticsService.ts` - Simulated analytics
- `mockVisitorService.ts` - Simulated visitor tracking

### Limitations
- ❌ No real API calls
- ❌ Data lost on page refresh
- ❌ No environment configuration
- ❌ React Query installed but not used
- ❌ Limited error handling

---

## Target State (After Integration)

### New Architecture

```
Components
    ↓
React Query Hooks (caching, loading, errors)
    ↓
Service Layer (HTTP API calls)
    ↓
API Client (axios with interceptors)
    ↓
Backend API (api.patrickcmd.dev)
```

### Benefits
- ✅ Real HTTP API calls
- ✅ Data persistence in DynamoDB
- ✅ Environment-specific APIs (dev/prod/mock)
- ✅ React Query for state management
- ✅ JWT authentication
- ✅ Proper error handling
- ✅ Loading states
- ✅ Type safety

---

## Integration Phases

### Phase 1: Authentication (HIGHEST PRIORITY)
**Blocks all other integrations**

Create:
- `src/config/env.ts` - Environment configuration
- `src/types/api.ts` - API type definitions
- `src/lib/apiClient.ts` - Base HTTP client
- `src/services/authService.ts` - Auth API service

Update:
- `src/contexts/AuthContext.tsx`

**Endpoints**: `/auth/login`, `/auth/logout`, `/auth/me`

---

### Phase 2: Blog Integration
Create:
- `src/types/blog.ts`
- `src/services/blogService.ts`
- `src/hooks/useBlogPosts.ts`

Update:
- `src/components/BlogTab.tsx`

**Endpoints**: 7 blog endpoints (CRUD + publish/unpublish)

---

### Phase 3: Projects Integration
Same structure as Blog Integration

**Endpoints**: 7 project endpoints

---

### Phase 4: Certifications Integration
Same structure as Blog/Projects Integration

**Endpoints**: 7 certification endpoints

---

### Phase 5: Visitor & Analytics Integration
Create:
- `src/types/analytics.ts`
- `src/services/visitorService.ts`
- `src/services/analyticsService.ts`
- `src/hooks/useVisitorAnalytics.ts`

Update:
- `src/components/VisitorCounter.tsx`
- `src/components/DashboardTab.tsx`

**Endpoints**: 10 analytics endpoints (visitor + content tracking)

---

## Environment Configuration

### API URLs

| Environment | API URL | Usage |
|-------------|---------|-------|
| Production | `https://api.patrickcmd.dev` | Live site |
| Development | `https://api-dev.patrickcmd.dev` | Testing with real API |
| Mock | `http://localhost:8080` | Offline development |

### Environment Files

**`.env.development`** (dev API):
```bash
VITE_API_BASE_URL=https://api-dev.patrickcmd.dev
VITE_USE_MOCK_API=false
VITE_DEBUG_API_CALLS=true
```

**`.env.production`** (prod API):
```bash
VITE_API_BASE_URL=https://api.patrickcmd.dev
VITE_USE_MOCK_API=false
VITE_DEBUG_API_CALLS=false
```

**`.env.local`** (mock API):
```bash
VITE_USE_MOCK_API=true
VITE_DEBUG_API_CALLS=true
```

### Testing Different Modes

```bash
# Development with real dev API
npm run dev

# Development with mock API (offline)
VITE_USE_MOCK_API=true npm run dev

# Production build
npm run build
npm run preview
```

---

## Key Implementation Patterns

### 1. Environment Configuration

```typescript
// src/config/env.ts
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.patrickcmd.dev',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  debugApiCalls: import.meta.env.VITE_DEBUG_API_CALLS === 'true',

  get apiUrl() {
    return `${this.apiBaseUrl}/v1`;
  },
};
```

### 2. Service Layer with Fallback

```typescript
// src/services/blogService.ts
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
}
```

### 3. React Query Hooks

```typescript
// src/hooks/useBlogPosts.ts
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blogs'],
    queryFn: () => blogService.getAllPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 4. Component Usage

```typescript
// src/components/BlogTab.tsx
export function BlogTab() {
  const { data: posts = [], isLoading, error } = useBlogPosts();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <BlogList posts={posts} />;
}
```

---

## Dependencies

### Required
```bash
npm install axios
```

### Already Installed (verify)
```bash
npm install @tanstack/react-query@latest
```

### Dev Dependencies
```bash
npm install -D @types/node
```

---

## Testing Strategy

### Per-Phase Testing

For each integration phase:

1. **Local Testing** (with mock API):
   ```bash
   VITE_USE_MOCK_API=true npm run dev
   ```

2. **Development API Testing**:
   ```bash
   npm run dev
   ```

3. **Production Build Testing**:
   ```bash
   npm run build
   npm run preview
   ```

### Test Checklist
- [ ] API calls succeed
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Data updates reflect immediately
- [ ] Mock API fallback works
- [ ] TypeScript types are correct
- [ ] No console errors

---

## Rollback Plan

### Quick Rollback
```bash
# Toggle back to mock API
VITE_USE_MOCK_API=true npm run dev
```

### Full Rollback
```bash
git log --oneline
git reset --hard <commit-before-integration>
npm run dev
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup codebase
- [ ] Create feature branch: `feature/api-integration`
- [ ] Install dependencies
- [ ] Set up environment files
- [ ] Review integration plan

### Phase 1: Authentication
- [ ] Create env config
- [ ] Create API client
- [ ] Create auth service
- [ ] Update AuthContext
- [ ] Test login/logout
- [ ] Commit changes

### Phase 2: Blog
- [ ] Create types and service
- [ ] Create React Query hooks
- [ ] Update BlogTab
- [ ] Test CRUD operations
- [ ] Commit changes

### Phase 3-5: Projects, Certifications, Analytics
- [ ] Follow same pattern as Phase 2
- [ ] Test each integration
- [ ] Commit changes

### Post-Migration
- [ ] Full end-to-end testing
- [ ] Production build test
- [ ] Update documentation
- [ ] Code review
- [ ] Deploy

---

## Success Criteria

Integration is successful when:

1. ✅ Authentication works with real JWT tokens
2. ✅ All CRUD operations function correctly
3. ✅ Visitor tracking increments (once per session)
4. ✅ Analytics data displays in charts
5. ✅ Loading states are smooth
6. ✅ Errors provide clear feedback
7. ✅ Environment switching works (dev/prod/mock)
8. ✅ Performance < 2s initial load
9. ✅ No TypeScript errors
10. ✅ Production build succeeds

---

## Additional Resources

### Backend API Documentation
- [OpenAPI Specification](../../openapi.yml) - Complete API spec
- [API Documentation](../../API.md) - Developer guide
- [Backend README](../../backend/README.md) - Backend implementation

### Frontend Documentation
- [Frontend README](../README.md) - Frontend setup guide
- [Main README](../../README.md) - Project overview

### Testing
- [E2E Tests](../../backend/tests/e2e_deployed/README.md) - Backend E2E testing guide
- [Testing API](../../backend/docs/TESTING_API.md) - API testing guide

---

## Questions or Issues?

If you encounter any questions or issues during implementation:

1. **Check the integration plan**: Most questions are answered in [API_INTEGRATION_PLAN.md](./API_INTEGRATION_PLAN.md)
2. **Review architecture diagrams**: Visual guides in [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Reference the summary**: Quick lookup in [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
4. **Ask for clarification**: Before proceeding if something is unclear

---

## Document Status

- **Created**: 2025-12-28
- **Status**: Planning phase - Ready for implementation
- **Next Step**: Review and approve integration plan
- **After Approval**: Begin Phase 1 (Authentication)

---

**Happy coding!** 🚀
