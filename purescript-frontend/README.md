# PureScript Frontend Conversion

## Overview

Converting the React/TypeScript frontend to PureScript + Halogen for better type safety and simpler component model.

## Progress

### ✅ Complete
- [x] Project setup (spago, packages)
- [x] Domain types (`Domain.Types`)
- [x] BroadcastChannel FFI
- [x] Broadcast message types
- [x] BroadcastManager with Halogen subscriptions
- [x] Player stats calculations (`Stats.PlayerStats`)
- [x] Theme system types (`Types.Theme`)
- [x] Format utilities (`Utils.FormatUtils`)
- [x] JSON codecs for domain types (`Domain.Codecs`)
- [x] JSON codecs for broadcast messages
- [x] Standings overlay component (proof of concept)

### 🚧 In Progress
- [ ] Main.purs entry point
- [ ] Routing setup

### 📋 TODO
- [ ] Complete JSON codecs for all domain types
- [ ] API client (Affjax)
- [ ] Tournament cache manager
- [ ] Routing (routing-duplex)
- [ ] Remaining 29 overlay pages
- [ ] Admin pages
- [ ] Build setup (esbuild/webpack)

## Architecture

### Key Differences from React

| React/TypeScript | PureScript/Halogen |
|-----------------|-------------------|
| `useState` | Component `State` type |
| `useEffect` | `Initialize` action + subscriptions |
| `useRef` | Component state |
| `useCallback` | Just functions (pure!) |
| Event listeners | Halogen subscriptions |
| Props drilling | Slots + queries |
| Hooks dependency hell | No dependency arrays! |

### Directory Structure

```
purescript-frontend/
├── src/
│   ├── Domain/
│   │   └── Types.purs              # Core domain types
│   ├── BroadcastChannel/
│   │   ├── BroadcastChannel.purs   # FFI bindings
│   │   ├── BroadcastChannel.js     # JS implementation
│   │   ├── Messages.purs           # Message types
│   │   └── Manager.purs            # Event routing
│   ├── Component/
│   │   ├── Standings.purs          # Standings overlay ✅
│   │   └── ...                     # Other overlays (TODO)
│   ├── Stats/
│   │   └── PlayerStats.purs        # Player statistics calculations
│   ├── Types/
│   │   └── Theme.purs              # Theme types
│   ├── Utils/
│   │   └── FormatUtils.purs        # Formatting utilities
│   ├── API/
│   │   └── Client.purs             # HTTP API client (TODO)
│   └── Main.purs                   # Entry point (TODO)
├── spago.dhall                     # Package config
└── packages.dhall                  # Package set
```

### Component Pattern

Components use Halogen's component model:

```purescript
component :: Component Query Input Output m
component = mkComponent
  { initialState
  , render
  , eval: mkEval $ defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }
```

No hooks, no dependency arrays, just:
1. State
2. Actions
3. Render function
4. Subscriptions (for broadcast events)

### Real-time Updates

Instead of React hooks + useEffect:

```purescript
-- Subscribe to broadcast messages
Initialize -> do
  manager <- liftEffect BroadcastManager.create

  -- Subscribe to tournament data responses
  void $ H.subscribe manager.tournamentDataResponseEmitter

  -- Send subscribe message
  BroadcastManager.postSubscribe manager subscribeMsg
```

Much cleaner than the TypeScript version!

## Status & Next Steps

### Current State

This conversion is **in progress** and represents significant architectural work completed:

✅ **Foundation Complete**:
- Core domain types with newtypes for type safety
- BroadcastChannel FFI for real-time updates
- Broadcast message types and routing
- Player statistics calculations (pure functions)
- JSON codecs for all domain types
- Theme system types
- Proof-of-concept Standings overlay component
- Main entry point

### Known Issues

**Build Dependencies**: The Halogen package requires additional dependencies that aren't in the standard package set:
- `halogen-vdom` - Virtual DOM implementation
- `dom-indexed` - Type-indexed HTML attributes
- `web-clipboard` - Clipboard events
- `web-touchevents` - Touch events
- Various other web platform packages

**Resolution**: Need to add these dependencies to `packages.dhall` or use Spago's package overrides.

### Next Steps

1. **Fix Build**: Add missing Halogen ecosystem packages
2. **Complete Standings Component**: Wire up actual broadcast subscriptions
3. **API Client**: Implement HTTP client using Affjax
4. **Routing**: Add URL routing with routing-duplex
5. **Convert Remaining Overlays**: 29 more overlay pages to convert
6. **Admin Pages**: Convert admin interface
7. **Build Pipeline**: Set up esbuild/webpack for production builds

## Building (Requires Dependency Fixes)

```bash
cd purescript-frontend
# First, fix packages.dhall to include all Halogen dependencies
spago build
spago bundle-app --to ../frontend/public/app.js
```

## Development

```bash
# Watch mode (after fixing dependencies)
spago build --watch

# REPL
spago repl
```

## Architecture Notes

- All domain types use newtypes for IDs (TournamentId, PlayerId, etc.)
- JSON codecs for API communication (using argonaut)
- FFI only for BroadcastChannel (everything else is pure PureScript)
- Tailwind classes still work (just strings in HH.className)
- No React/hooks complexity!
- Pure functional approach - no mutable state except in Effect/Aff
- Type-safe message passing through BroadcastChannel
