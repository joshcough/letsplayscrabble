const API_BASE: string =
  process.env.NODE_ENV === "production"
    ? window.location.origin // Use the full origin URL in production
    : "http://localhost:3001"; // In development, use localhost

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
});

export const failure = <T>(error: string): ApiResponse<T> => ({
  success: false,
  error
});

// Core function that preserves the ApiResponse
const fetchApiResponseWithAuth = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  console.log("response", response)

  // For non-2xx responses, still try to parse the ApiResponse
  if (!response.ok) {
    try {
      const errorResponse = await response.json();
      // If it's already an ApiResponse failure, return it
      if (errorResponse && 'success' in errorResponse && !errorResponse.success) {
        return errorResponse as ApiResponse<T>;
      }
      // Otherwise create a failure response
      return failure(errorResponse.message || "Request failed");
    } catch {
      return failure("Request failed");
    }
  }

  if (response.status === 204) {
    return success(null as T);
  }

  const data = await response.json();

  // If already an ApiResponse, return as-is
  if (data && 'success' in data) {
    return data as ApiResponse<T>;
  }

  // Legacy endpoint - wrap in success
  return success(data as T);
};

// Convenience function that throws on failure (existing behavior)
const fetchWithAuth = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetchApiResponseWithAuth<T>(endpoint, options);
  if (response.success) {
    return response.data;
  } else {
    throw new Error(response.error);
  }
};

export { API_BASE, fetchWithAuth, fetchApiResponseWithAuth };