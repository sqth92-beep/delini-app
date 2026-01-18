import { QueryClient, QueryFunction } from "@tanstack/react-query";
const BASE_URL = "https://delini-backend.onrender.com";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  try {
    const res = await fetch(`${BASE_URL}${cleanUrl}`, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/");
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    try {
      const res = await fetch(`${BASE_URL}${cleanPath}`);
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      alert(`Query Error (${queryKey.join("/")}): ${error.message}`);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
