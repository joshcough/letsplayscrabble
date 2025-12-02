.PHONY: bundle build build-css watch watch-css dev test clean help

# Default target
.DEFAULT_GOAL := help

# Bundle PureScript and JavaScript (most common command)
bundle:
	@echo "Building PureScript and bundling..."
	@npm run bundle

# Build everything (CSS + PureScript bundle)
build:
	@echo "Building CSS and PureScript..."
	@npm run build

# Build CSS only
build-css:
	@echo "Building CSS..."
	@npm run build:css

# Watch PureScript files for changes
watch:
	@echo "Watching PureScript files..."
	@npm run watch

# Watch CSS files for changes
watch-css:
	@echo "Watching CSS files..."
	@npm run watch:css

# Start development server
dev:
	@echo "Starting development server on http://localhost:4000"
	@npm run dev

# Run tests
test:
	@echo "Running tests..."
	@npm test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf output .spago public/bundle.js public/styles.css

# Show help
help:
	@echo "Available commands:"
	@echo "  make bundle      - Build PureScript and bundle JavaScript (fastest for quick rebuilds)"
	@echo "  make build       - Build CSS and PureScript bundle (full build)"
	@echo "  make build-css   - Build CSS only"
	@echo "  make watch       - Watch PureScript files for changes"
	@echo "  make watch-css   - Watch CSS files for changes"
	@echo "  make dev         - Start development server on port 4000"
	@echo "  make test        - Run unit tests"
	@echo "  make clean       - Remove build artifacts"
	@echo "  make help        - Show this help message"
