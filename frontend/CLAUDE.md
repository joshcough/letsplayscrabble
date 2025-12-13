# PureScript Frontend - Development Workflow

## 📚 Documentation

- **This file**: Local development workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Production deployment to Heroku
- **[Root README](../README.md)**: Full project documentation

## Quick Start (Recommended: Run from ROOT)

The easiest way to develop is from the **project root**:

```bash
# From project root - runs BOTH frontend + backend with auto-watch
npm run dev

# Visit http://localhost:3001
# Edit code → reload browser → see changes!
```

## Frontend-Only Development

If you only want to work on the frontend:

```bash
# From frontend/ directory
make build     # Build once (CSS + PureScript + bundle)
make dev       # Start dev server on http://localhost:4000

# OR with auto-rebuild:
make watch     # Auto-rebuilds on any .purs or .css change
# (in another terminal) make dev
```

## Commands (from frontend/ directory)

```bash
make build   # Build everything (CSS + PureScript + bundle)
make watch   # Watch files and auto-rebuild on changes
make dev     # Start development server on port 4000
make test    # Run unit tests
make clean   # Remove build artifacts
make help    # Show help
```

## Commands (from project root)

```bash
npm run dev              # Run both frontend + backend with auto-watch
npm run dev:frontend     # Frontend only (auto-rebuild on changes)
npm run dev:backend      # Backend only (auto-restart on changes)
npm run build            # Build both
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
```

## File Structure

```
purescript-frontend/
├── src/
│   ├── Main.purs                    # Entry point for main app
│   ├── WorkerMain.purs              # Entry point for worker page
│   ├── Component/                   # UI components
│   │   ├── Router.purs              # Main router
│   │   ├── Navigation.purs          # Navigation bar
│   │   ├── HomePage.purs            # Home/dashboard
│   │   ├── Standings.purs           # Standings display
│   │   └── ...
│   ├── Config/
│   │   └── Themes.purs              # Theme configurations
│   ├── Types/                       # Type definitions
│   │   ├── Theme.purs
│   │   └── CurrentMatch.purs
│   ├── Domain/
│   │   └── Types.purs               # Domain types (newtypes)
│   ├── CSS/                         # CSS helpers
│   │   ├── Class.purs               # Tailwind class ADT
│   │   └── ThemeColor.purs          # Theme color mapping
│   ├── Utils/
│   │   └── CSS.purs                 # CSS value helpers
│   └── index.css                    # Tailwind source
├── test/
│   ├── Main.purs                    # Test runner
│   ├── Test/
│   │   ├── Utils.purs               # Test helpers (roundTrip, shouldRoundTrip)
│   │   ├── Types/
│   │   │   └── CurrentMatchSpec.purs
│   │   └── Domain/
│   │       └── TypesSpec.purs
├── public/                          # Served static files
│   ├── index.html                   # Main entry point
│   ├── bundle.js                    # Main app bundle (~424KB)
│   ├── styles.css                   # Compiled Tailwind CSS
│   ├── worker.html                  # Worker page
│   └── worker-bundle.js             # Worker bundle
├── output/                          # Compiled PureScript (generated)
├── Makefile                         # Build commands
├── spago.dhall                      # PureScript dependencies
├── package.json                     # npm dependencies
├── tailwind.config.js               # Tailwind configuration
└── DEPLOYMENT.md                    # Production deployment guide
```

## Build Scripts

Run `make help` to see all available commands:

- `make build` - Build CSS + PureScript + bundle (full build)
- `make bundle` - Build PureScript and bundle JavaScript (most common)
- `make build-css` - Build Tailwind CSS only
- `make test` - Run unit tests
- `make watch` - Watch PureScript files and recompile
- `make watch-css` - Watch CSS files and rebuild
- `make dev` - Start development server on port 4000
- `make clean` - Remove build artifacts

## Troubleshooting

### Page won't load
- Make sure `npm run dev` is running
- Check that bundle.js and styles.css exist in public/

### Changes not showing
- Did you run `npm run bundle` after editing .purs files?
- Did you run `npm run build:css` after editing themes?
- Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)

### Port 4000 already in use
```bash
lsof -ti:4000 | xargs kill -9
```
