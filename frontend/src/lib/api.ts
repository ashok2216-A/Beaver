export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  data?: any;
}

let clerkToken: string | null = null;

export const setClerkToken = (token: string | null) => {
  clerkToken = token;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { data, ...init } = options;

  const headers = { ...init.headers } as any;

  if (clerkToken) {
    headers["Authorization"] = `Bearer ${clerkToken}`;
  }

  if (data) {
    if (data instanceof FormData) {
      init.body = data;
    } else {
      init.body = JSON.stringify(data);
      headers["Content-Type"] = "application/json";
    }
  }

  init.headers = headers;

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorBody.detail || response.statusText);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: any) => request<T>(path, { method: "POST", data }),
  patch: <T>(path: string, data?: any) => request<T>(path, { method: "PATCH", data }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
