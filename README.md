# Let's Play Scrabble

Tournament management system with real-time overlays for streaming.

## Quick Start

From project root:

```bash
# Install dependencies
npm install

# Run both frontend + backend with auto-watch
npm run dev

# Visit http://localhost:3001
```

## Development Commands

All commands run from **project root**:

```bash
# Development (auto-watch - edit code and reload browser!)
npm run dev              # Run BOTH frontend + backend with auto-watch
npm run dev:frontend     # Frontend only (auto-rebuilds on .purs/.css changes)
npm run dev:backend      # Backend only (auto-restarts on .ts changes)

# Build
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Format code
npm run format           # Run prettier on backend + frontend
```

## Deployment

```bash
# From project root
./deploy.sh              # Builds frontend, commits bundles, deploys to Heroku
```

## Project Structure

```
.
├── frontend/           # PureScript frontend (Halogen + Tailwind)
├── backend/            # TypeScript backend (Express + Socket.IO + PostgreSQL)
├── shared/             # Shared types between frontend/backend
├── old/                # Old React frontend (archived)
└── deploy.sh           # Deployment script
```

## Tech Stack

**Frontend:**
- PureScript (Halogen framework)
- Tailwind CSS
- Socket.IO client for real-time updates
- esbuild for bundling

**Backend:**
- TypeScript
- Express
- Socket.IO for real-time broadcasting
- PostgreSQL (Knex ORM)
- JWT authentication

## Documentation

- **Frontend**: See `frontend/CLAUDE.md` for detailed frontend docs
- **Backend**: See `backend/README.md` for backend docs
- **Deployment**: See `frontend/DEPLOYMENT.md` for Heroku deployment guide
