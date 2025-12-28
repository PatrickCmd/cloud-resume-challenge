# Patrick's Portfolio Website

A modern, responsive portfolio website showcasing my professional experience, projects, and skills. Built as part of the Cloud Resume Challenge.

## Live Demo

**Lovable Live URL**: https://patrick-persona-page.lovable.app/

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
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once (for CI/CD)
- `npm run test:ui` - Run tests with visual UI
- `npm run test:coverage` - Generate coverage report

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/            # Page components
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
├── public/               # Static assets
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
- **Dynamic Counts** - Real-time blog count in tab navigation

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

- **141 tests** across authentication, blog, project, and certification services and React Query hooks
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
- Total: 141 integration tests

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
│   └── certificationService.test.ts     # 23 tests - Certification API integration
├── hooks/__tests__/
│   ├── useBlogPosts.test.tsx            # 16 tests - Blog React Query hooks
│   ├── useProjects.test.tsx             # 16 tests - Project React Query hooks
│   └── useCertifications.test.tsx       # 17 tests - Certification React Query hooks
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

The project uses ESLint for code quality checks. Run linting with:

Using Make:
```sh
make lint
```

Using npm:
```sh
npm run lint
```

### Styling

Tailwind CSS is configured with custom theme extensions. See [tailwind.config.ts](tailwind.config.ts) for configuration.

### Components

UI components are built using shadcn-ui, which provides accessible, customizable components. See [components.json](components.json) for configuration.

## Deployment

This project is deployed on Lovable's hosting platform. Any changes pushed to the main branch are automatically deployed.

To deploy manually:
1. Visit the [Lovable Project](https://lovable.dev)
2. Navigate to Share → Publish

## Contributing

This is a personal portfolio project, but suggestions and feedback are welcome! Feel free to open an issue or submit a pull request.

## License

This project is open source and available under the MIT License.

## Contact

Patrick Walukagga
- GitHub: [@PatrickCmd](https://github.com/PatrickCmd)
- Portfolio: https://patrick-persona-page.lovable.app/
