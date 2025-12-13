# PureScript Frontend - Development Workflow

## 📚 Documentation

- **This file**: Local development workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Production deployment to Heroku
- **[Makefile](./Makefile)**: Build commands (`make help`)

## Quick Start

### Initial Setup
```bash
npm install
```

### Development Workflow

1. **Build CSS** (do this once, or when you change themes):
   ```bash
   make build-css  # or npm run build:css
   ```

2. **Bundle PureScript** (do this after any .purs file changes):
   ```bash
   make bundle  # or npm run bundle
   ```

3. **Start the dev server**:
   ```bash
   make dev  # or npm run dev
   ```

4. **Open in browser**:
   - Worker page: http://localhost:4000/worker.html
   - Main app: http://localhost:4000/index.html

### Full Rebuild
```bash
make build  # or npm run build (CSS + PureScript)
```

### Run Tests
```bash
make test  # or npm test
```

### Watch Mode (Advanced)

If you want auto-rebuild on file changes, run these in separate terminals:

**Terminal 1** - Watch PureScript:
```bash
npm run watch
```

**Terminal 2** - Watch CSS:
```bash
npm run watch:css
```

**Terminal 3** - Dev Server:
```bash
npm run dev
```

Then manually re-run `npm run bundle` after the watch compiles your changes.

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
