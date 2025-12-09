.PHONY: help install dev build build-dev preview lint clean start stop

# Default target
help:
	@echo "Available commands:"
	@echo "  make install     - Install project dependencies"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build for production"
	@echo "  make build-dev   - Build in development mode"
	@echo "  make preview     - Preview production build"
	@echo "  make lint        - Run ESLint checks"
	@echo "  make clean       - Remove node_modules and build artifacts"
	@echo "  make start       - Alias for 'make dev'"
	@echo "  make stop        - Stop any running dev servers"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Start development server
dev:
	@echo "Starting development server at http://localhost:5173"
	npm run dev

# Alias for dev
start: dev

# Build for production
build:
	@echo "Building for production..."
	npm run build
	@echo "Build complete! Output in dist/"

# Build in development mode
build-dev:
	@echo "Building in development mode..."
	npm run build:dev
	@echo "Development build complete! Output in dist/"

# Preview production build
preview:
	@echo "Starting preview server..."
	npm run preview

# Run linter
lint:
	@echo "Running ESLint..."
	npm run lint

# Clean build artifacts and dependencies
clean:
	@echo "Cleaning build artifacts and dependencies..."
	rm -rf node_modules dist .vite
	@echo "Clean complete!"

# Stop running dev servers (kills processes on port 5173)
stop:
	@echo "Stopping dev servers on port 5173..."
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "No processes found on port 5173"
