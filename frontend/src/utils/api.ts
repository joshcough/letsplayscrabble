import { API_BASE } from "../config/api";

/**
 * Generic fetch function for API endpoints that may return null on 404
 */
export const fetchApiEndpoint = async <T>(endpoint: string, errorContext: string): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Resource not found
      }
      throw new Error(`${errorContext}: ${response.statusText}`);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    throw error;
  }
};