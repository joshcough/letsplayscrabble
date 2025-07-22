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

/**
 * Generic fetch function for user-scoped overlay API endpoints (for match data)
 */
export const fetchUserOverlayEndpoint = async <T>(
  userId: number,
  endpoint: string,
  errorContext: string
): Promise<T | null> => {
  const userScopedEndpoint = `/api/overlay/users/${userId}${endpoint}`;
  return fetchApiEndpoint<T>(userScopedEndpoint, errorContext);
};

/**
 * Generic fetch function for user-scoped tournament API endpoints (for tournament data)
 */
export const fetchUserTournamentEndpoint = async <T>(
  userId: number,
  endpoint: string,
  errorContext: string
): Promise<T | null> => {
  const userScopedEndpoint = `/api/tournaments/public/users/${userId}${endpoint}`;
  return fetchApiEndpoint<T>(userScopedEndpoint, errorContext);
};

/**
 * Generic fetch function for authenticated admin API endpoints
 */
export const fetchAuthenticatedApiEndpoint = async <T>(
  endpoint: string,
  errorContext: string,
  options: RequestInit = {}
): Promise<T | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Resource not found
      }
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
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

/**
 * POST request for authenticated admin API endpoints
 */
export const postAuthenticatedApiEndpoint = async <T, B = any>(
  endpoint: string,
  body: B,
  errorContext: string
): Promise<T | null> => {
  return fetchAuthenticatedApiEndpoint<T>(endpoint, errorContext, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * PUT request for authenticated admin API endpoints
 */
export const putAuthenticatedApiEndpoint = async <T, B = any>(
  endpoint: string,
  body: B,
  errorContext: string
): Promise<T | null> => {
  return fetchAuthenticatedApiEndpoint<T>(endpoint, errorContext, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};