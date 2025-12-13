.PHONY: build watch dev test clean help

# Default target
.DEFAULT_GOAL := help

# Build everything (CSS + PureScript + bundle)
build:
	@echo "Building everything..."
	@npm run build

# Watch all files and rebuild on changes
watch:
	@echo "Watching for changes (auto-rebuild on .purs or .css changes)..."
	@npm run watch

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
	@echo "  make build   - Build everything (CSS + PureScript + bundle)"
	@echo "  make watch   - Watch files and auto-rebuild on changes"
	@echo "  make dev     - Start development server on port 4000"
	@echo "  make test    - Run unit tests"
	@echo "  make clean   - Remove build artifacts"
	@echo "  make help    - Show this help message"
	@echo ""
	@echo "Typical workflow:"
	@echo "  Terminal 1: make watch   (auto-rebuild on file changes)"
	@echo "  Terminal 2: make dev     (dev server)"
	@echo "  Then just edit code and reload browser!"
