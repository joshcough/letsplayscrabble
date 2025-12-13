// Logging configuration FFI
// Logging is disabled by default everywhere (including localhost/dev)
// To enable logging: add ?logging=true to URL
// This prevents console.log from causing memory issues in long-running OBS overlays

// Check for URL parameter override (works in browser only)
// This is called dynamically on each log to handle hash changes
function checkLoggingEnabled() {
  if (typeof window !== 'undefined') {
    // Check hash-based routing URLs (e.g., #/overlay/standings?userId=2&logging=true)
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryString = hash.split('?')[1];
      const urlParams = new URLSearchParams(queryString);
      if (urlParams.get('logging') === 'true') {
        return true;
      }
    }

    // Also check regular query params (e.g., ?logging=true)
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('logging') === 'true';
  }
  return false;
}

// Export as getter function so main-entry.js can check it at load time
export const loggingEnabled = checkLoggingEnabled();

// Conditional log function - checks dynamically each time
export function logImpl(message) {
  return function() {
    if (checkLoggingEnabled()) {
      console.log(message);
    }
  };
}

// Conditional log with value function (for showing values) - checks dynamically each time
export function logShowImpl(label) {
  return function(value) {
    return function() {
      if (checkLoggingEnabled()) {
        console.log(label, value);
      }
    };
  };
}
