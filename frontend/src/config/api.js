const API_BASE = process.env.NODE_ENV === 'production'
  ? window.location.origin  // Use the full origin URL in production
  : 'http://localhost:3001'; // In development, use localhost

export { API_BASE };