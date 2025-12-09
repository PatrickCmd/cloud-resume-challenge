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
make help          # Show all available commands
make install       # Install project dependencies
make dev           # Start development server
make build         # Build for production
make build-dev     # Build in development mode
make preview       # Preview production build
make lint          # Run ESLint checks
make clean         # Remove node_modules and build artifacts
make stop          # Stop running dev servers on port 5173
```

### Using npm directly

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── docs/               # Documentation
├── dist/               # Production build output (generated)
├── Makefile            # Build automation
└── package.json        # Dependencies and scripts
```

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
