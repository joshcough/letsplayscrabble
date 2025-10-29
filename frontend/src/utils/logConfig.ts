// Logging configuration
// To enable logging in development: REACT_APP_ENABLE_LOGGING=true npm start
// Production always has logging disabled to prevent memory bloat

const ENABLE_LOGGING =
  process.env.NODE_ENV !== 'production' &&
  process.env.REACT_APP_ENABLE_LOGGING === 'true';

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
