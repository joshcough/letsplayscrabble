// Emergency production logging configuration
// Wraps console methods to disable in production builds

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Override console.log in production to prevent memory bloat in OBS
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  // Keep console.warn and console.error for important messages
}

export const logConfig = {
  isProduction,
  loggingEnabled: !isProduction
};
