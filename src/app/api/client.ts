
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")
    ? `${window.location.origin}/api` 
    : "http://localhost:5000/api");

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  
  const headers: Record<string, string> = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  // Only add Content-Type: application/json if body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Something went wrong");
  }

  return response.json();
};
