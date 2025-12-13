// utils/api.ts - API utility functions and helpers
import { ApiResponse } from "../config/api";

const API_BASE: string =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:3001";

// Base fetch function with error handling
export const baseFetch = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const url = `${API_BASE}${endpoint}`;
  console.log("🌐 API Request:", url);

  const response = await fetch(url, options);

  console.log("📡 API Response:", {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  return response;
};

// Parse API response (handles both ApiResponse format and raw data)
export const parseApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If we can't parse error JSON, use the status text
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // If it's wrapped in ApiResponse format, unwrap it
  if (data && typeof data === "object" && "success" in data) {
    const apiResponse = data as ApiResponse<T>;
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      throw new Error(apiResponse.error);
    }
  }

  // Otherwise return raw data
  return data as T;
};

// Get authentication headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Wrapper for ApiResponse format (preserves success/error structure)
export const fetchApiResponseWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const response = await baseFetch(endpoint, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    const data = await parseApiResponse<T>(response);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Safe API response parser that doesn't throw - returns ApiResponse<T>
export const parseApiResponseSafe = async <T>(
  response: Response,
): Promise<ApiResponse<T>> => {
  try {
    if (response.status === 204) {
      return { success: true, data: null as T };
    }

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse error JSON, use the status text
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    // If it's wrapped in ApiResponse format, return it directly
    if (data && typeof data === "object" && "success" in data) {
      return data as ApiResponse<T>;
    }

    // Otherwise wrap raw data in success response
    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
};

// Safe baseFetch wrapper that returns ApiResponse<T>
export const baseFetchSafe = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const response = await baseFetch(endpoint, options);
    return await parseApiResponseSafe<T>(response);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
};

export { API_BASE };
