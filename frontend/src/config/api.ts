const API_BASE: string =
  process.env.NODE_ENV === "production"
    ? window.location.origin // Use the full origin URL in production
    : "http://localhost:3001"; // In development, use localhost

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  // Don't try to parse JSON for 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return data;
};

export { API_BASE, fetchWithAuth };
