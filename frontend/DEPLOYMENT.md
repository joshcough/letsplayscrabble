# PureScript Frontend Deployment Guide

This document outlines how to replace the React frontend with the PureScript frontend in production on Heroku.

## Overview

The PureScript frontend is a complete rewrite of the React frontend with better type safety, cleaner architecture, and comparable bundle size (~424KB). This guide covers the steps needed to deploy it to Heroku.

---

## Prerequisites

- Access to Heroku CLI
- Heroku app already configured
- PureScript frontend built and tested locally

---

## Deployment Steps

### 1. Install PureScript on Heroku (Option A - Buildpack)

Heroku doesn't have PureScript by default. Add the buildpack:

```bash
heroku buildpacks:add https://github.com/MattKetmo/heroku-buildpack-purescript
```

**Note**: This increases build time significantly. See Option B for faster alternative.

### 1. Alternative: Commit Built Files (Option B - Recommended)

Skip the buildpack and commit the built files instead:

```bash
# Build locally
cd purescript-frontend
make build  # or npm run build

# The following files will be generated:
# - public/bundle.js
# - public/styles.css

# Commit them (they're already in the repo structure)
git add public/bundle.js public/styles.css
```

---

### 2. Update Root package.json

Edit `/package.json` in the project root:

**Before:**
```json
{
  "scripts": {
    "postinstall": "cd frontend && npm install && npm run build && cd ../backend && npm install",
    "heroku-postbuild": "cd frontend && npm install && npm run build && cd ../backend && cp -r ../shared . && npm install && npm run build && npm run migrate:latest"
  }
}
```

**After:**
```json
{
  "scripts": {
    "postinstall": "cd purescript-frontend && npm install && npm run build && cd ../backend && npm install",
    "heroku-postbuild": "cd purescript-frontend && npm install && npm run build && cd ../backend && cp -r ../shared . && npm install && npm run build && npm run migrate:latest"
  }
}
```

---

### 3. Update Backend Server

Edit `backend/src/server.ts` (around lines 193-198):

**Before:**
```typescript
// Serve static files from the React frontend app
app.use(express.static(path.join(projectRoot, "frontend/build")));

// Anything that doesn't match the above, send back index.html
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, "frontend/build/index.html"));
});
```

**After:**
```typescript
// Serve static files from the PureScript frontend app
app.use(express.static(path.join(projectRoot, "purescript-frontend/public")));

// Anything that doesn't match the above, send back index.html
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, "purescript-frontend/public/index.html"));
});
```

---

### 4. Test Locally

Before deploying to Heroku, test the setup locally:

```bash
# 1. Build the PureScript frontend
cd purescript-frontend
make build  # This runs CSS + PureScript + bundling

# 2. Build the backend
cd ../backend
npm run build

# 3. Start the backend (which will serve the PureScript frontend)
npm start

# 4. Test at http://localhost:3001
# Verify all routes work:
# - / (home page with login)
# - /home (after login)
# - /tournaments (tournament manager)
# - /overlays (overlay page)
# - /admin/current-match (admin page)
```

**Important**: The backend runs on port 3001 and serves the frontend at the root path.

---

### 5. Deploy to Heroku

```bash
# 1. Make sure all changes are committed
git status

# 2. Commit if needed
git add .
git commit -m "Switch to PureScript frontend for production"

# 3. Push to Heroku
git push heroku purescript-standings-basic:main

# 4. Monitor deployment logs
heroku logs --tail

# 5. Test production
# Visit your Heroku app URL and verify:
# - Login works
# - Navigation works
# - All pages load correctly
# - WebSocket connections work (for real-time updates)
```

---

## File Structure Comparison

### React Frontend (Old)
```
frontend/build/
├── index.html
├── static/
│   ├── css/
│   │   └── main.*.css
│   └── js/
│       └── main.*.js
├── asset-manifest.json
└── letsplayscrabble.png
```

### PureScript Frontend (New)
```
purescript-frontend/public/
├── index.html           # Entry point
├── bundle.js            # Main app bundle (~424KB)
├── styles.css           # Tailwind CSS
├── letsplayscrabble.png # Logo
├── worker.html          # Web Worker page
└── worker-bundle.js     # Worker bundle
```

---

## Build Process Details

The build process consists of:

1. **CSS Build** (`npm run build:css`)
   - Compiles `src/index.css` using Tailwind
   - Outputs to `public/styles.css`
   - Minified for production

2. **PureScript Compilation** (`spago build`)
   - Compiles all `*.purs` files in `src/`
   - Type checks everything
   - Outputs to `output/` directory

3. **JavaScript Bundling** (`npx esbuild`)
   - Bundles PureScript output + dependencies
   - Entry point: `main-entry.js`
   - Outputs to `public/bundle.js`
   - Minified for production

**Full build command**:
```bash
make build  # or npm run build
```

---

## Key Differences from React

### Routing
- Both use client-side routing
- Backend catch-all route (`app.get("*")`) handles this
- No server-side changes needed for routing

### Bundle Size
- React: ~400KB (minified)
- PureScript: ~424KB (minified)
- Comparable size with better tree-shaking

### Static Assets
- Both serve from a `public/` or `build/` directory
- PureScript uses `public/` directly
- No asset manifest file needed

### API Calls
- Both make requests to `/api/*` endpoints
- Backend API remains unchanged
- Authentication flow is identical

---

## Rollback Plan

If something goes wrong in production:

```bash
# 1. Revert the commit
git revert HEAD

# 2. Push to Heroku
git push heroku purescript-standings-basic:main

# OR checkout the previous commit
git checkout <previous-commit-hash>
git push heroku HEAD:main --force
```

---

## Troubleshooting

### Build Fails on Heroku

**Symptom**: `spago: command not found`

**Solution**: Use Option B (commit built files) instead of buildpack.

### 404 on Routes

**Symptom**: Direct navigation to `/tournaments` returns 404

**Solution**: Verify the catch-all route in `server.ts` is correct:
```typescript
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, "purescript-frontend/public/index.html"));
});
```

### CSS Not Loading

**Symptom**: Page loads but has no styling

**Solution**:
1. Verify `public/styles.css` exists
2. Run `make build-css` to regenerate
3. Check browser console for 404 on `/styles.css`

### Bundle.js Not Found

**Symptom**: White screen, console error: "Failed to load resource: bundle.js"

**Solution**:
1. Verify `public/bundle.js` exists
2. Run `make bundle` to regenerate
3. Check file permissions

---

## Performance Considerations

### Build Time
- **Local**: ~5-10 seconds (incremental)
- **Heroku with buildpack**: 2-5 minutes (first build)
- **Heroku with committed files**: Same as React build

### Runtime Performance
- Comparable to React
- Better type safety means fewer runtime errors
- Excellent tree-shaking reduces bundle bloat

---

## Future Improvements

1. **Progressive Migration**: Deploy both frontends side-by-side
2. **A/B Testing**: Use feature flags to test with subset of users
3. **Service Worker**: Add offline support
4. **Code Splitting**: Split bundle by route for faster initial load

---

## Questions?

- Check the main README: `purescript-frontend/CLAUDE.md`
- Review build commands: `make help`
- Test locally before deploying: `make build && make dev`

---

**Last Updated**: December 1, 2025
