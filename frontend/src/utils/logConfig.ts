// Logging configuration
// To enable logging in development: REACT_APP_ENABLE_LOGGING=true npm start
// To enable logging on a specific page in production: add ?logging=true to URL
// This allows debugging production issues without affecting all OBS overlays

// Check for URL parameter override (works in browser only)
const urlParams = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search)
  : null;
const loggingUrlParam = urlParams?.get('logging') === 'true';

const ENABLE_LOGGING =
  loggingUrlParam ||
  (process.env.NODE_ENV !== 'production' &&
   process.env.REACT_APP_ENABLE_LOGGING === 'true');

if (!ENABLE_LOGGING) {
  // Disable console.log and console.debug to prevent memory bloat
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  // Keep console.warn and console.error for important messages
}

export const logConfig = {
  loggingEnabled: ENABLE_LOGGING
};
