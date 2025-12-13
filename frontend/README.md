# PureScript Frontend

A type-safe, functional frontend for Let's Play Scrabble built with PureScript and Halogen.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build everything
make build

# Start dev server
make dev

# Open browser to http://localhost:4000
```

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development workflow and local setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide for Heroku
- **[Makefile](./Makefile)** - All build commands (`make help`)

## 🧪 Testing

```bash
make test  # Run all tests (13/13 passing ✓)
```

## 🏗️ Architecture

### Tech Stack
- **PureScript** - Type-safe functional programming language
- **Halogen** - Type-safe UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **esbuild** - Fast JavaScript bundler

### Key Features
- ✅ **Type Safety** - No runtime type errors
- ✅ **Derived JSON Codecs** - Automatic serialization
- ✅ **Theme System** - Multiple themes with type-safe CSS
- ✅ **Client-Side Routing** - SPA navigation
- ✅ **Real-Time Updates** - WebSocket integration
- ✅ **Test Coverage** - Round trip tests for all JSON codecs

## 📦 Bundle Size

- **Main bundle**: ~424KB (minified)
- **Worker bundle**: ~159KB (minified)
- Comparable to React with better type safety and tree-shaking

## 🎨 Themes

Built-in themes:
- **Modern** - Dark with blue accents
- **Scrabble** - Warm amber/brown (default)
- **July 4th** - Patriotic red/white/blue
- **Original** - Simple black and white

## 📂 Project Structure

```
src/
├── Main.purs              # Main app entry point
├── Component/             # UI components
│   ├── Router.purs        # Main router
│   ├── Navigation.purs    # Navigation bar
│   ├── HomePage.purs      # Home/dashboard
│   ├── TournamentManagerPage.purs
│   ├── Standings.purs     # Standings display
│   └── ...
├── Config/                # Configuration (themes, etc)
├── Types/                 # Type definitions
├── Domain/                # Domain types
├── CSS/                   # CSS helpers
└── Utils/                 # Utility functions

test/
├── Main.purs              # Test runner
└── Test/                  # Test suites
    ├── Utils.purs         # Test helpers
    ├── Types/             # Type tests
    └── Domain/            # Domain tests

public/
├── index.html             # Entry HTML
├── bundle.js              # Compiled app
└── styles.css             # Compiled CSS
```

## 🔧 Development

```bash
# Most common workflow:
make bundle   # Rebuild PureScript
# Refresh browser

# Or use watch mode:
make watch    # Terminal 1: Watch PureScript
make dev      # Terminal 2: Dev server
```

## 🚢 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full Heroku deployment instructions.

Quick summary:
1. Update root `package.json` to use `purescript-frontend`
2. Update `backend/src/server.ts` to serve from `purescript-frontend/public`
3. Build locally: `make build`
4. Deploy to Heroku

## 🆚 Comparison with React Frontend

| Feature | React | PureScript |
|---------|-------|------------|
| Type Safety | TypeScript | PureScript (stronger) |
| Runtime Errors | Possible | Extremely rare |
| Bundle Size | ~400KB | ~424KB |
| Tree Shaking | Good | Excellent |
| Compile Time | Fast | Moderate |
| Readability | Good | Excellent |
| State Management | Hooks | Component State |
| Effect System | Untyped | Typed (Effect/Aff) |

## 🎯 Why PureScript?

### Type Safety
No `any`, no `null/undefined` surprises, no runtime type errors:
```purescript
-- This won't compile:
let x: Maybe String = Nothing
let y: String = x  -- Type error!

-- You must handle all cases:
case x of
  Just value -> value
  Nothing -> "default"
```

### Simpler Component Model
No hooks, no dependency arrays, just state + actions:
```purescript
-- React: useState, useEffect, useCallback, useMemo, useRef...
-- PureScript: Just a component with state and actions
component = mkComponent
  { initialState
  , render
  , eval: mkEval defaultEval { handleAction }
  }
```

### Better Refactoring
The compiler catches everything:
- Rename a type? Compiler finds all usages
- Change a function signature? Compiler updates all call sites
- Forget a case in pattern match? Compiler warns you

## 🤝 Contributing

1. Make changes to `src/` files
2. Run `make test` to verify tests pass
3. Run `make build` to create production bundle
4. Test locally before deploying

## 📝 License

Same as parent project.

---

**Built with ❤️ using PureScript**
