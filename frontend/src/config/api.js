const API_BASE = process.env.NODE_ENV === 'production'
  ? '' // In production, use relative URLs (same domain)
  : 'http://localhost:3001'; // In development, use localhost