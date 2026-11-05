# Patrick's Portfolio Website

The frontend for [patrickcmd.dev](https://patrickcmd.dev): a single-scroll landing page for Patrick Walukagga, Software & AI Engineer, plus the project case studies, blog and owner admin area that sit behind it. Built as part of the Cloud Resume Challenge and served from S3 + CloudFront.

## Live Site

**https://patrickcmd.dev** (API: https://api.patrickcmd.dev)

## Tech Stack

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Radix UI** - Accessible component primitives

## Prerequisites

Before running this project locally, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js) or **bun** (optional, faster alternative)

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/PatrickCmd/cloud-resume-challenge.git
cd cloud-resume-challenge/frontend
```

### 2. Install Dependencies

Using Make (recommended):
```sh
make install
```

Using npm:
```sh
npm install
```

Or using bun (faster):
```sh
bun install
```

### 3. Run the Development Server

Using Make (recommended):
```sh
make dev
```

Using npm:
```sh
npm run dev
```

Or using bun:
```sh
bun run dev
```

The application will start at `http://localhost:5173` (default Vite port) or `http://localhost:8080`.

The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- Fast refresh for React components
- Auto-opening in your default browser

### 4. Build for Production

To create an optimized production build:

Using Make:
```sh
make build
```

Using npm:
```sh
npm run build
```

This will generate static files in the `dist/` directory.

### 5. Preview Production Build

To preview the production build locally:

Using Make:
```sh
make preview
```

Using npm:
```sh
npm run preview
```

This serves the built files from `dist/` directory.

## Available Scripts

### Using Make (Recommended)

A Makefile is provided for convenience. Run `make help` to see all available commands:

```sh
make help            # Show all available commands
make install         # Install project dependencies
make dev             # Start development server
make build           # Build for production
make build-dev       # Build in development mode
make preview         # Preview production build
make lint            # Run ESLint checks
make test            # Run tests in watch mode
make test-run        # Run all tests once (CI mode)
make test-ui         # Run tests with visual UI
make test-coverage   # Run tests with coverage report
make clean           # Remove node_modules and build artifacts
make stop            # Stop running dev servers on port 5173
```

### Using npm directly

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run typecheck` - Type-check with `tsc --noEmit`
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once (for CI/CD)
- `npm run test:ui` - Run tests with visual UI
- `npm run test:coverage` - Generate coverage report

## Content (`src/content/`)

All copy on the public pages lives in typed TypeScript files under `src/content/`. Edit these, not the components.

| File | What it holds | Rendered by |
|---|---|---|
| `profile.ts` | Name, title, headline, description, location, employer, email, links (GitHub, LinkedIn, X, AI twin, resume), availability pill text, About paragraph, resume summary, education. Helpers `yearsOfExperience()` and `profileFacts()`. | Hero, About, Contact, header, footer, resume PDF, metadata |
| `skills.ts` | Four `SkillGroup`s (Backend, Data, Cloud & Infra, AI/ML) and `coreStack`. | Skills section, resume PDF |
| `experience.ts` | `ExperienceEntry[]` newest first: company, role, location, `start`/`end` (`YYYY-MM`, `end: null` for the current role), 2–3 outcome bullets, tech tags. Helpers `formatPeriod()` and `isOlderThan()`. Roles that ended more than five years ago collapse behind "Show earlier roles". | Experience timeline, resume PDF |
| `projects.ts` | `Project[]`: slug, title, one-line problem, outcome, tags, cover image, links, `caseStudy`, `featured`. The first six `featured` entries make the home-page grid. | Projects section, `/projects/:slug`, sitemap |
| `case-studies/<slug>.md` | Markdown with `## Context`, `## Architecture`, `## Decisions`, `## Results`. Bundled as raw strings via `import.meta.glob`; the slug must match a project with `caseStudy: true`. | `/projects/:slug` |
| `certifications.ts` | Credentials with `badge` image path and `credentialUrl` (Credly). `featured` ones form the badge row. | Certifications section, resume PDF |
| `writing.ts` | Static fallback list for the Writing section when the blog API is unreachable. | Writing section |

Static assets that derive from content and are committed to `public/`:

- `og.png` (1200×630 share image): `node scripts/generate-og.cjs src/assets/avatar.jpg public/og.png`
- `Patrick-Walukagga-Resume.pdf`: `node scripts/generate-resume.cjs`
- Favicons (`favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) are rendered from `public/favicon.svg`: `node scripts/generate-icons.cjs`, then rebuild `favicon.ico` from the 16/32/48 px frames (see the script header). Edit the SVG to change the mark.

Both scripts need Playwright with Chromium (`npx playwright install chromium` once). Rerun them when the name, title, headline, experience, skills or certifications change. `sitemap.xml` needs no script: a Vite plugin in `vite.config.ts` writes it on every build from `projects.ts`.

## Routes

| Path | Page | Source of data |
|---|---|---|
| `/` | Landing page: Hero, About, Skills, Experience, Projects, Certifications, Writing, Contact | `src/content/` (Writing also asks the blog API) |
| `/projects` | All projects | Portfolio API |
| `/projects/:slug` | Case study | `src/content/case-studies/` |
| `/blog`, `/blog/:slug` | Posts | Portfolio API |
| `/admin` | Owner login, dashboard and editors for projects, posts and certifications | Portfolio API (Cognito-protected) |

Everything except `/` is lazy-loaded. The owner login is only reachable at `/admin`.

## Project Structure

```
frontend/
├── src/
│   ├── content/          # All public copy (see "Content" above)
│   ├── sections/         # Landing-page sections (Hero, About, Skills, ...)
│   ├── components/       # Reusable React components, Layout, SiteHeader, SiteFooter
│   ├── pages/            # Route components (Home, CaseStudy, BlogPost, Admin, ...)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   └── apiClient.ts  # Axios HTTP client with JWT interceptors
│   ├── services/         # API service layer
│   │   ├── authService.ts      # Real Cognito authentication
│   │   └── mockAuthService.ts  # Mock authentication (development)
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── config/           # Configuration
│   │   └── env.ts        # Environment variables
│   ├── types/            # TypeScript types
│   │   └── api.ts        # API request/response types
│   ├── test/             # Test utilities
│   │   ├── setup.ts      # Global test setup
│   │   └── utils.tsx     # Test helpers and fixtures
│   └── main.tsx          # Application entry point
├── public/               # Static assets (og.png, resume PDF, badges, project covers)
├── scripts/              # generate-og.cjs, generate-resume.cjs
├── docs/                 # Documentation
│   └── TESTING.md        # Testing guide (comprehensive)
├── dist/                 # Production build output (generated)
├── coverage/             # Test coverage reports (generated)
├── vitest.config.ts      # Vitest test configuration
├── Makefile              # Build automation
└── package.json          # Dependencies and scripts
```

## API Integration

This frontend integrates with a serverless FastAPI backend deployed on AWS.

### Authentication

- **Amazon Cognito** - User authentication with JWT tokens
- **Auth Service** - Real API integration with token management
- **Auth Context** - React context for authentication state
- **Protected Routes** - Owner-only access to admin features

### Blog Integration

- **Blog Service** - Type-safe blog API integration with Axios
- **React Query Hooks** - Data fetching, caching, and mutations
- **CRUD Operations** - Create, read, update, delete blog posts
- **Publish/Unpublish** - Workflow for managing draft and published posts
- **Status Management** - Separate queries for published and draft posts

### Projects Integration

- **Project Service** - Type-safe project API integration with Axios
- **React Query Hooks** - Data fetching, caching, and mutations for projects
- **CRUD Operations** - Create, read, update, delete project entries
- **Publish/Unpublish** - Draft and published project workflow
- **Featured Projects** - Support for featured project filtering
- **Status Management** - Separate queries for published and draft projects

### Certifications Integration

- **Certification Service** - Type-safe certification API integration with Axios
- **React Query Hooks** - Data fetching, caching, and mutations for certifications
- **CRUD Operations** - Create, read, update, delete certification entries
- **Publish/Unpublish** - Draft and published certification workflow
- **Type Filtering** - Support for certification vs course type filtering
- **Status Management** - Separate queries for published and draft certifications
- **Expiry Dates** - Support for certification expiry date tracking

### Visitor & Analytics Integration

- **Visitor Service** - Type-safe visitor tracking API integration with Axios
- **Analytics Service** - Type-safe analytics API integration with Axios
- **React Query Hooks** - Data fetching and mutations for visitor tracking and analytics
- **Visitor Tracking** - Automatic page visit tracking with backend cookie deduplication
- **Content View Tracking** - Track views for blog posts, projects, and certifications
- **Session Deduplication** - Frontend sessionStorage prevents duplicate view tracking
- **Analytics Dashboard** - Real-time visitor counts, content views, and trends
- **Top Content** - Statistics for most viewed content across all types
- **Visitor Trends** - Daily and monthly visitor analytics
- **Total Metrics** - Total visitors and total content views

### Environment Configuration

Configure API endpoints in `.env` files:

```bash
# Production (.env.production)
VITE_API_BASE_URL=https://api.patrickcmd.dev
VITE_USE_MOCK_API=false

# Development (.env.development)
VITE_API_BASE_URL=https://api-dev.patrickcmd.dev
VITE_USE_MOCK_API=false  # or true for mock data
```

### API Client

The application uses Axios with automatic:
- JWT token injection in Authorization headers
- Token refresh on 401 errors
- Error handling and formatting
- Request/response interceptors

See [src/lib/apiClient.ts](src/lib/apiClient.ts) for implementation.

## Testing

Comprehensive testing infrastructure with Vitest and Testing Library.

### Test Coverage

- **198 tests** across authentication, content management, visitor tracking, and analytics
- **100% passing** - All integration tests verified
- **Coverage**: Run `make test-coverage` to generate reports

**Test Breakdown**:
- Authentication: 26 tests (authService + AuthContext)
- Blog Service: 28 tests (blogService.test.ts)
- Blog Hooks: 16 tests (useBlogPosts.test.tsx)
- Project Service: 21 tests (projectService.test.ts)
- Project Hooks: 16 tests (useProjects.test.tsx)
- Certification Service: 23 tests (certificationService.test.ts)
- Certification Hooks: 17 tests (useCertifications.test.tsx)
- Visitor Service: 14 tests (visitorService.test.ts)
- Analytics Service: 23 tests (analyticsService.test.ts)
- Visitor & Analytics Hooks: 20 tests (useVisitorAnalytics.test.tsx)
- Total: 198 integration tests

### Running Tests

```bash
# Watch mode (auto-rerun on changes)
make test

# Run once (for CI/CD)
make test-run

# Visual UI (browser-based)
make test-ui

# Coverage report
make test-coverage
```

### Test Structure

```
src/
├── services/__tests__/
│   ├── authService.test.ts              # 14 tests - Auth API integration
│   ├── blogService.test.ts              # 28 tests - Blog API integration
│   ├── projectService.test.ts           # 21 tests - Project API integration
│   ├── certificationService.test.ts     # 23 tests - Certification API integration
│   ├── visitorService.test.ts           # 14 tests - Visitor tracking API integration
│   └── analyticsService.test.ts         # 23 tests - Analytics API integration
├── hooks/__tests__/
│   ├── useBlogPosts.test.tsx            # 16 tests - Blog React Query hooks
│   ├── useProjects.test.tsx             # 16 tests - Project React Query hooks
│   ├── useCertifications.test.tsx       # 17 tests - Certification React Query hooks
│   └── useVisitorAnalytics.test.tsx     # 20 tests - Visitor & Analytics React Query hooks
├── contexts/__tests__/
│   └── AuthContext.test.tsx             # 12 tests - React context hooks
└── test/
    ├── setup.ts                       # Global test configuration
    └── utils.tsx                      # Test helpers and fixtures
```

### Test Documentation

See [docs/TESTING.md](docs/TESTING.md) for:
- Complete testing guide (600+ lines)
- Test structure and organization
- Best practices and patterns
- Examples and troubleshooting
- CI/CD integration

## Development

### Code Quality

ESLint and TypeScript both run clean (`npm run lint`, `npm run typecheck`). Run linting with:

Using Make:
```sh
make lint
```

Using npm:
```sh
npm run lint
```

### Styling

Tailwind CSS with design tokens as CSS variables in [src/index.css](src/index.css) (light and dark; the theme follows the system by default). Colors meet WCAG AA contrast, prose is capped at 72ch, and `prefers-reduced-motion` disables animations. See [tailwind.config.ts](tailwind.config.ts) for the Tailwind side.

### Components

UI components are built using shadcn-ui, which provides accessible, customizable components. See [components.json](components.json) for configuration.

## Deployment

The site is hosted on AWS (S3 + CloudFront + Route 53). `npm run build` produces `dist/`, which the Ansible playbooks in [`../aws/playbooks`](../aws/playbooks) upload and invalidate; see the root [README](../README.md#deployment-workflow) for the full flow. CloudFront maps 403/404 to `index.html`, so the client-side routes above work on direct load.

### Continuous integration

[`.github/workflows/frontend-ci.yml`](../.github/workflows/frontend-ci.yml) runs `npm run lint`, `npm run typecheck`, `npm run test:run` and `npm run build` on every pull request that touches `frontend/`.

## Contributing

This is a personal portfolio project, but suggestions and feedback are welcome! Feel free to open an issue or submit a pull request.

## License

This project is open source and available under the MIT License.

## Contact

Patrick Walukagga
- GitHub: [@PatrickCmd](https://github.com/PatrickCmd)
- Portfolio: https://patrickcmd.dev/
