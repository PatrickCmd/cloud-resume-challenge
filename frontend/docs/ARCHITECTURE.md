# Frontend Architecture - Before and After API Integration

**Visual guide to the frontend architecture transformation**

---

## Current Architecture (Mock Services)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  React Application (localhost:5173)                       │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  App.tsx                                             │ │ │
│  │  │  ├── QueryClientProvider (NOT USED)                 │ │ │
│  │  │  └── ThemeProvider                                   │ │ │
│  │  │      └── AuthProvider (AuthContext)                  │ │ │
│  │  │          └── Components                              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Components (Direct Service Calls)                   │ │ │
│  │  │                                                       │ │ │
│  │  │  BlogTab.tsx                                         │ │ │
│  │  │    ├── useEffect(() => mockBlogDB.getAllPosts())    │ │ │
│  │  │    └── useState(posts)                               │ │ │
│  │  │                                                       │ │ │
│  │  │  ProjectsTab.tsx                                     │ │ │
│  │  │    ├── useEffect(() => mockProjectsDB.getAll())     │ │ │
│  │  │    └── useState(projects)                            │ │ │
│  │  │                                                       │ │ │
│  │  │  CertificationsTab.tsx                               │ │ │
│  │  │    └── useEffect(() => mockCertificationsDB.getAll())│ │ │
│  │  │                                                       │ │ │
│  │  │  VisitorCounter.tsx                                  │ │ │
│  │  │    └── useEffect(() => mockVisitorService.track())   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                          │                                 │ │
│  │                          │ Direct function calls           │ │
│  │                          ▼                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Mock Services (In-Memory)                           │ │ │
│  │  │                                                       │ │ │
│  │  │  mockAuthService.ts                                  │ │ │
│  │  │    let currentUser = null                            │ │ │
│  │  │    function login() { setTimeout(..., 500ms) }       │ │ │
│  │  │                                                       │ │ │
│  │  │  mockBlogDatabase.ts                                 │ │ │
│  │  │    let mockDatabase = [...]                          │ │ │
│  │  │    function getAllPosts() { return mockDatabase }    │ │ │
│  │  │                                                       │ │ │
│  │  │  mockProjectsDatabase.ts                             │ │ │
│  │  │    let projects = [...]                              │ │ │
│  │  │                                                       │ │ │
│  │  │  mockCertificationsDatabase.ts                       │ │ │
│  │  │    let certifications = [...]                        │ │ │
│  │  │                                                       │ │ │
│  │  │  mockVisitorService.ts                               │ │ │
│  │  │    let visitorCount = 1247                           │ │ │
│  │  │                                                       │ │ │
│  │  │  mockAnalyticsService.ts                             │ │ │
│  │  │    let viewCounts = {}                               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  All data is LOST on page refresh ❌                      │ │
│  │  No real API calls ❌                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Current Flow Issues

1. **Manual State Management**: Each component manages its own loading/error states
2. **No Caching**: Every component re-fetches data on mount
3. **No Persistence**: Data lost on refresh
4. **Artificial Delays**: Mock services use setTimeout to simulate network
5. **No Error Handling**: Services don't throw real errors
6. **React Query Unused**: Installed but not utilized
7. **Hardcoded Credentials**: `admin123` password in mock service

---

## Target Architecture (Real API Integration)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Browser                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  React Application (localhost:5173 or patrickcmd.dev)               │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  App.tsx                                                        │  │ │
│  │  │  ├── QueryClientProvider ✅ (NOW USED)                         │  │ │
│  │  │  │   └── Global cache for all API data                         │  │ │
│  │  │  └── ThemeProvider                                              │  │ │
│  │  │      └── AuthProvider (AuthContext)                             │  │ │
│  │  │          └── Components                                         │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Components (Use React Query Hooks)                            │  │ │
│  │  │                                                                 │  │ │
│  │  │  BlogTab.tsx                                                   │  │ │
│  │  │    const { data, isLoading, error } = useBlogPosts()           │  │ │
│  │  │    const createMutation = useCreateBlogPost()                  │  │ │
│  │  │                                                                 │  │ │
│  │  │  ProjectsTab.tsx                                               │  │ │
│  │  │    const { data, isLoading } = useProjects()                   │  │ │
│  │  │                                                                 │  │ │
│  │  │  CertificationsTab.tsx                                         │  │ │
│  │  │    const { data } = useCertifications()                        │  │ │
│  │  │                                                                 │  │ │
│  │  │  VisitorCounter.tsx                                            │  │ │
│  │  │    const { data: count } = useVisitorCount()                   │  │ │
│  │  │    const trackMutation = useTrackVisitor()                     │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                          │                                            │ │
│  │                          │ React Query manages:                       │ │
│  │                          │ - Caching (5-10 min)                       │ │
│  │                          │ - Loading states                           │ │
│  │                          │ - Error handling                           │ │
│  │                          │ - Refetching                               │ │
│  │                          ▼                                            │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  React Query Hooks Layer                                       │  │ │
│  │  │                                                                 │  │ │
│  │  │  useBlogPosts.ts                                               │  │ │
│  │  │    useQuery({ queryKey: ['blogs'], queryFn: blogService.get })│  │ │
│  │  │                                                                 │  │ │
│  │  │  useProjects.ts                                                │  │ │
│  │  │    useQuery({ queryKey: ['projects'], ... })                  │  │ │
│  │  │                                                                 │  │ │
│  │  │  useCertifications.ts                                          │  │ │
│  │  │    useQuery({ queryKey: ['certs'], ... })                     │  │ │
│  │  │                                                                 │  │ │
│  │  │  useVisitorAnalytics.ts                                        │  │ │
│  │  │    useQuery({ queryKey: ['visitor'], ... })                   │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                          │                                            │ │
│  │                          │ Calls service methods                      │ │
│  │                          ▼                                            │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Service Layer (HTTP API Calls)                                │  │ │
│  │  │                                                                 │  │ │
│  │  │  authService.ts                                                │  │ │
│  │  │    ├── login(email, password)                                  │  │ │
│  │  │    ├── logout()                                                │  │ │
│  │  │    └── getCurrentUser()                                        │  │ │
│  │  │                                                                 │  │ │
│  │  │  blogService.ts                                                │  │ │
│  │  │    ├── getAllPosts()                                           │  │ │
│  │  │    ├── createPost(data)                                        │  │ │
│  │  │    ├── updatePost(id, data)                                    │  │ │
│  │  │    ├── deletePost(id)                                          │  │ │
│  │  │    ├── publishPost(id)                                         │  │ │
│  │  │    └── unpublishPost(id)                                       │  │ │
│  │  │                                                                 │  │ │
│  │  │  projectService.ts, certificationService.ts                    │  │ │
│  │  │  visitorService.ts, analyticsService.ts                        │  │ │
│  │  │                                                                 │  │ │
│  │  │  Each service has fallback to mock:                            │  │ │
│  │  │    if (env.useMockApi) return mockService.method()             │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                          │                                            │ │
│  │                          │ Uses base HTTP client                      │ │
│  │                          ▼                                            │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  API Client (Axios with Interceptors)                          │  │ │
│  │  │                                                                 │  │ │
│  │  │  apiClient.ts                                                  │  │ │
│  │  │    ├── baseURL: env.apiUrl                                     │  │ │
│  │  │    ├── timeout: 30s                                            │  │ │
│  │  │    │                                                            │  │ │
│  │  │    ├── Request Interceptor:                                    │  │ │
│  │  │    │   - Add Authorization: Bearer {token}                     │  │ │
│  │  │    │   - Log requests if DEBUG=true                            │  │ │
│  │  │    │                                                            │  │ │
│  │  │    └── Response Interceptor:                                   │  │ │
│  │  │        - Format errors                                         │  │ │
│  │  │        - Handle 401 → auto logout                              │  │ │
│  │  │        - Log responses if DEBUG=true                           │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  │                          │                                            │ │
│  │                          │ HTTP/HTTPS Requests                        │ │
│  │                          ▼                                            │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Environment Configuration                                      │  │ │
│  │  │                                                                 │  │ │
│  │  │  env.ts                                                        │  │ │
│  │  │    apiUrl = useMockApi                                         │  │ │
│  │  │      ? 'http://localhost:8080'                                 │  │ │
│  │  │      : isDev                                                   │  │ │
│  │  │        ? 'https://api-dev.patrickcmd.dev/v1'                   │  │ │
│  │  │        : 'https://api.patrickcmd.dev/v1'                       │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  AWS Cloud                                                                 │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  API Gateway (api.patrickcmd.dev or api-dev.patrickcmd.dev)         │ │
│  │                                                                       │ │
│  │  ├── Cognito JWT Authorizer                                         │ │
│  │  │   └── Validates Bearer token                                     │ │
│  │  │                                                                   │ │
│  │  ├── CORS Configuration                                             │ │
│  │  │   └── Allow: https://patrickcmd.dev                             │ │
│  │  │                                                                   │ │
│  │  └── Routes:                                                         │ │
│  │      ├── POST /auth/login → Lambda                                  │ │
│  │      ├── GET /blog/posts → Lambda                                   │ │
│  │      ├── POST /blog/posts → Lambda (auth required)                  │ │
│  │      ├── GET /projects → Lambda                                     │ │
│  │      ├── GET /certifications → Lambda                               │ │
│  │      ├── POST /visitors/track → Lambda                              │ │
│  │      └── GET /analytics/top-content → Lambda (auth required)        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                                    │ Invokes                               │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  AWS Lambda (FastAPI Backend)                                        │ │
│  │                                                                       │ │
│  │  Production: production-portfolio-api-PortfolioApiFunction           │ │
│  │  Development: development-portfolio-api-PortfolioApiFunction         │ │
│  │                                                                       │ │
│  │  ├── Mangum (ASGI adapter)                                          │ │
│  │  ├── FastAPI application                                            │ │
│  │  │   ├── /auth endpoints                                            │ │
│  │  │   ├── /blog endpoints                                            │ │
│  │  │   ├── /projects endpoints                                        │ │
│  │  │   ├── /certifications endpoints                                  │ │
│  │  │   ├── /visitors endpoints                                        │ │
│  │  │   └── /analytics endpoints                                       │ │
│  │  │                                                                   │ │
│  │  └── Environment Variables:                                         │ │
│  │      ├── DYNAMODB_TABLE_NAME                                        │ │
│  │      ├── COGNITO_USER_POOL_ID                                       │ │
│  │      ├── COGNITO_CLIENT_ID                                          │ │
│  │      └── ENVIRONMENT (production/development)                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                          │                       │                         │
│                          │                       │                         │
│                          ▼                       ▼                         │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Amazon Cognito                │  │  DynamoDB                        │ │
│  │                                │  │                                  │ │
│  │  User Pool:                    │  │  Table: portfolio-api-table      │ │
│  │  - JWT tokens                  │  │  or development-portfolio-api-   │ │
│  │  - User authentication         │  │      table                       │ │
│  │  - Owner role validation       │  │                                  │ │
│  │                                │  │  Single-table design:            │ │
│  │  Owner Account:                │  │  ├── Blog posts                 │ │
│  │  - email: owner@patrickcmd.dev │  │  ├── Projects                   │ │
│  │  - role: owner                 │  │  ├── Certifications             │ │
│  │                                │  │  ├── Visitor tracking           │ │
│  │  Tokens:                       │  │  └── Analytics data             │ │
│  │  - ID Token (1 hour)           │  │                                  │ │
│  │  - Access Token (1 hour)       │  │  Data persists ✅               │ │
│  │  - Refresh Token (30 days)     │  │                                  │ │
│  └────────────────────────────────┘  └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────────┐
│   User       │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Click "Login"
       │    email: owner@patrickcmd.dev
       │    password: YourPassword123!
       ▼
┌──────────────────────────────────────────────────────┐
│  LoginDialog.tsx                                     │
│                                                       │
│  const { login } = useAuth()                         │
│  await login(email, password)                        │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2. Calls AuthContext login()
       ▼
┌──────────────────────────────────────────────────────┐
│  AuthContext.tsx                                     │
│                                                       │
│  const { user, token } = await authService.login()   │
│  setUser(user)                                       │
│  localStorage.setItem('auth_token', token)           │
└──────┬───────────────────────────────────────────────┘
       │
       │ 3. Calls authService
       ▼
┌──────────────────────────────────────────────────────┐
│  authService.ts                                      │
│                                                       │
│  const response = await apiClient.post(              │
│    '/auth/login',                                    │
│    { email, password }                               │
│  )                                                   │
│                                                       │
│  const tokens = response.data // JWT tokens          │
│  apiClient.updateAuthToken(tokens.id_token)          │
│                                                       │
│  const user = await apiClient.get('/auth/me')        │
│  return { user, token: tokens.id_token }             │
└──────┬───────────────────────────────────────────────┘
       │
       │ 4. HTTP POST /auth/login
       ▼
┌──────────────────────────────────────────────────────┐
│  API Gateway (api.patrickcmd.dev/v1/auth/login)     │
│                                                       │
│  ├── No auth required for /auth/login               │
│  └── Forwards to Lambda                              │
└──────┬───────────────────────────────────────────────┘
       │
       │ 5. Invokes Lambda
       ▼
┌──────────────────────────────────────────────────────┐
│  Lambda (FastAPI Backend)                            │
│                                                       │
│  POST /auth/login                                    │
│  ├── Validates credentials with Cognito              │
│  ├── Returns JWT tokens:                             │
│  │   - id_token (1 hour, has custom:role claim)     │
│  │   - access_token (1 hour)                         │
│  │   - refresh_token (30 days)                       │
│  │   - expires_in (3600 seconds)                     │
│  └── Returns 200 OK                                  │
└──────┬───────────────────────────────────────────────┘
       │
       │ 6. Response flows back
       ▼
┌──────────────────────────────────────────────────────┐
│  Frontend (Browser)                                  │
│                                                       │
│  ✅ User logged in                                   │
│  ✅ Token stored in localStorage                     │
│  ✅ All subsequent requests include:                 │
│     Authorization: Bearer {id_token}                 │
│                                                       │
│  ✅ Token auto-injected by axios interceptor         │
└──────────────────────────────────────────────────────┘
```

---

## Data Fetching Flow (Example: Blog Posts)

```
┌──────────────┐
│  User        │
│ (Browser)    │
└──────┬───────┘
       │
       │ 1. Navigate to Blog tab
       ▼
┌──────────────────────────────────────────────────────┐
│  BlogTab.tsx                                         │
│                                                       │
│  const { data: posts, isLoading, error } =           │
│    useBlogPosts()                                    │
│                                                       │
│  if (isLoading) return <Spinner />                   │
│  if (error) return <ErrorMessage />                  │
│  return <BlogList posts={posts} />                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2. React Query checks cache
       ▼
┌──────────────────────────────────────────────────────┐
│  React Query (QueryClient)                           │
│                                                       │
│  queryKey: ['blogs']                                 │
│  staleTime: 5 minutes                                │
│                                                       │
│  Cache hit (< 5 min old)?                            │
│    YES → Return cached data ✅                       │
│    NO  → Fetch from API ⬇                            │
└──────┬───────────────────────────────────────────────┘
       │
       │ 3. Calls queryFn
       ▼
┌──────────────────────────────────────────────────────┐
│  useBlogPosts.ts                                     │
│                                                       │
│  export function useBlogPosts() {                    │
│    return useQuery({                                 │
│      queryKey: ['blogs'],                            │
│      queryFn: () => blogService.getAllPosts(),       │
│      staleTime: 5 * 60 * 1000,                       │
│    })                                                │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 4. Calls service
       ▼
┌──────────────────────────────────────────────────────┐
│  blogService.ts                                      │
│                                                       │
│  async getAllPosts() {                               │
│    if (env.useMockApi) {                             │
│      return mockBlogDB.getAllPosts()  // Fallback    │
│    }                                                 │
│                                                       │
│    const response = await apiClient.get(             │
│      '/blog/posts'                                   │
│    )                                                 │
│    return response.data.posts                        │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 5. HTTP GET /blog/posts
       │    (Authorization header auto-injected)
       ▼
┌──────────────────────────────────────────────────────┐
│  apiClient.ts (Axios Interceptor)                    │
│                                                       │
│  Request Interceptor:                                │
│    const token = localStorage.getItem('auth_token')  │
│    config.headers.Authorization = `Bearer ${token}`  │
│                                                       │
│  axios.get('https://api.patrickcmd.dev/v1/blog/posts')│
└──────┬───────────────────────────────────────────────┘
       │
       │ 6. HTTPS Request
       ▼
┌──────────────────────────────────────────────────────┐
│  API Gateway                                         │
│                                                       │
│  ├── CORS check (Allow: https://patrickcmd.dev)     │
│  ├── JWT validation (if token provided)             │
│  └── Forward to Lambda                               │
└──────┬───────────────────────────────────────────────┘
       │
       │ 7. Invokes Lambda
       ▼
┌──────────────────────────────────────────────────────┐
│  Lambda (FastAPI Backend)                            │
│                                                       │
│  GET /blog/posts                                     │
│  ├── Query DynamoDB for published blog posts         │
│  ├── Return: { posts: [...], total: 42 }            │
│  └── Status: 200 OK                                  │
└──────┬───────────────────────────────────────────────┘
       │
       │ 8. Response
       ▼
┌──────────────────────────────────────────────────────┐
│  React Query                                         │
│                                                       │
│  ✅ Stores in cache (queryKey: ['blogs'])           │
│  ✅ Sets staleTime: 5 minutes                        │
│  ✅ Returns data to component                        │
│  ✅ Sets isLoading: false                            │
└──────┬───────────────────────────────────────────────┘
       │
       │ 9. Component re-renders
       ▼
┌──────────────────────────────────────────────────────┐
│  BlogTab.tsx                                         │
│                                                       │
│  ✅ displays blog posts                              │
│  ✅ loading spinner hidden                           │
│  ✅ no error message                                 │
└──────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────┐
│  User        │
│ (Browser)    │
└──────┬───────┘
       │
       │ 1. Action (e.g., delete blog post)
       ▼
┌──────────────────────────────────────────────────────┐
│  BlogTab.tsx                                         │
│                                                       │
│  const deleteMutation = useDeleteBlogPost()          │
│  await deleteMutation.mutateAsync(postId)            │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2. Mutation
       ▼
┌──────────────────────────────────────────────────────┐
│  useBlogPosts.ts                                     │
│                                                       │
│  export function useDeleteBlogPost() {               │
│    return useMutation({                              │
│      mutationFn: (id) => blogService.deletePost(id), │
│      onSuccess: () => { /* invalidate cache */ },    │
│      onError: (error) => { /* show toast */ }        │
│    })                                                │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 3. Service call
       ▼
┌──────────────────────────────────────────────────────┐
│  blogService.ts                                      │
│                                                       │
│  async deletePost(id) {                              │
│    await apiClient.delete(`/blog/posts/${id}`)       │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 4. HTTP DELETE request
       ▼
┌──────────────────────────────────────────────────────┐
│  Backend API                                         │
│                                                       │
│  Scenario A: Success → 204 No Content                │
│  Scenario B: Not Found → 404 Not Found               │
│  Scenario C: Unauthorized → 401 Unauthorized         │
└──────┬───────────────────────────────────────────────┘
       │
       │ 5. Response interceptor
       ▼
┌──────────────────────────────────────────────────────┐
│  apiClient.ts (Axios Response Interceptor)           │
│                                                       │
│  ✅ 2xx Success → return response                    │
│                                                       │
│  ❌ 401 Unauthorized:                                │
│     - Clear auth token                               │
│     - Dispatch 'auth:unauthorized' event             │
│     - Reject with formatted error                    │
│                                                       │
│  ❌ 4xx/5xx Errors:                                  │
│     - Format error: { error, message, statusCode }   │
│     - Log if DEBUG=true                              │
│     - Reject with error                              │
└──────┬───────────────────────────────────────────────┘
       │
       │ 6. Error flows back
       ▼
┌──────────────────────────────────────────────────────┐
│  useBlogPosts.ts (onError handler)                   │
│                                                       │
│  onError: (error) => {                               │
│    toast({                                           │
│      variant: "destructive",                         │
│      title: "Failed to delete post",                 │
│      description: error.message                      │
│    })                                                │
│  }                                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ 7. User sees error toast
       ▼
┌──────────────────────────────────────────────────────┐
│  UI (Toast Notification)                             │
│                                                       │
│  🔴 Failed to delete post                            │
│     Post not found or already deleted                │
└──────────────────────────────────────────────────────┘
```

---

## Environment Switching

```
┌─────────────────────────────────────────────────────────────┐
│  Development Mode                                           │
│  (npm run dev)                                              │
│                                                             │
│  .env.development:                                          │
│    VITE_API_BASE_URL=https://api-dev.patrickcmd.dev        │
│    VITE_USE_MOCK_API=false                                 │
│    VITE_DEBUG_API_CALLS=true                               │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  env.ts                                            │    │
│  │  apiUrl = 'https://api-dev.patrickcmd.dev/v1'     │    │
│  │  useMockApi = false                                │    │
│  │  debugApiCalls = true                              │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                     │    │
│  │  if (env.useMockApi) {                             │    │
│  │    return mockService.method() ❌ Skipped         │    │
│  │  }                                                 │    │
│  │  // Make real API call ✅                          │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│           HTTPS → api-dev.patrickcmd.dev                    │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AWS Lambda (Development)                          │    │
│  │  DynamoDB: development-portfolio-api-table         │    │
│  │  Cognito: Same User Pool (different env)           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Mock Mode (Offline Development)                            │
│  (VITE_USE_MOCK_API=true npm run dev)                      │
│                                                             │
│  .env.local:                                                │
│    VITE_USE_MOCK_API=true                                  │
│    VITE_DEBUG_API_CALLS=true                               │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  env.ts                                            │    │
│  │  useMockApi = true ✅                              │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                     │    │
│  │  if (env.useMockApi) {                             │    │
│  │    return mockService.method() ✅ Used            │    │
│  │  }                                                 │    │
│  │  // API call skipped ❌                            │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Mock Services (In-Memory)                         │    │
│  │  - No network calls                                │    │
│  │  - Instant responses                               │    │
│  │  - Works offline                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Production Mode                                            │
│  (npm run build && npm run preview)                         │
│                                                             │
│  .env.production:                                           │
│    VITE_API_BASE_URL=https://api.patrickcmd.dev            │
│    VITE_USE_MOCK_API=false                                 │
│    VITE_DEBUG_API_CALLS=false                              │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  env.ts                                            │    │
│  │  apiUrl = 'https://api.patrickcmd.dev/v1'         │    │
│  │  useMockApi = false                                │    │
│  │  debugApiCalls = false                             │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                     │    │
│  │  if (env.useMockApi) {                             │    │
│  │    return mockService.method() ❌ Skipped         │    │
│  │  }                                                 │    │
│  │  // Make real API call ✅                          │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│           HTTPS → api.patrickcmd.dev                        │
│                           │                                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AWS Lambda (Production)                           │    │
│  │  DynamoDB: production-portfolio-api-table          │    │
│  │  Cognito: Same User Pool                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits of New Architecture

### 1. **React Query Caching**
- ✅ Data cached for 5-10 minutes
- ✅ Reduces redundant API calls
- ✅ Instant data on subsequent renders

### 2. **Automatic Loading States**
- ✅ `isLoading` flag from React Query
- ✅ No manual `useState(loading)` needed
- ✅ Consistent loading UX

### 3. **Centralized Error Handling**
- ✅ Axios interceptors catch all errors
- ✅ Formatted error responses
- ✅ Toast notifications in React Query hooks

### 4. **JWT Token Management**
- ✅ Auto-injection via axios interceptors
- ✅ Auto-logout on 401 errors
- ✅ No manual token handling in components

### 5. **Environment Flexibility**
- ✅ Toggle between mock/dev/prod APIs
- ✅ Feature flags for gradual rollout
- ✅ Works offline with mock API

### 6. **Type Safety**
- ✅ TypeScript interfaces for all API responses
- ✅ Compile-time type checking
- ✅ IntelliSense for API data

### 7. **Data Persistence**
- ✅ Data stored in DynamoDB
- ✅ Survives page refreshes
- ✅ Cross-device synchronization

### 8. **Performance**
- ✅ Optimistic updates with React Query
- ✅ Parallel requests
- ✅ Request deduplication

---

**Related Documents**:
- [API Integration Plan](./API_INTEGRATION_PLAN.md) - Detailed implementation guide
- [Integration Summary](./INTEGRATION_SUMMARY.md) - Quick reference

**Status**: Planning phase - Ready for implementation approval
