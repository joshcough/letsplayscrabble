// config/api.ts - API configuration and types
const API_BASE: string =
  process.env.NODE_ENV === "production"
    ? window.location.origin // Use the full origin URL in production
    : "http://localhost:3001"; // In development, use localhost

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const failure = <T>(error: string): ApiResponse<T> => ({
  success: false,
  error,
});

export { API_BASE };