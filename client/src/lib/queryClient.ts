import { QueryClient, QueryFunction } from "@tanstack/react-query";

const BASE_URL = "https://delini-backend.onrender.com";

async function throwIfResNotOk(res: Response, url: string) {
  if (!res.ok) {
    const text = await res.text();
    alert(`DEBUG_LOG: Error at ${url}\nStatus: ${res.status}\nResponse: ${text.substring(0, 100)}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${cleanUrl}`;
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    await throwIfResNotOk(res, cleanUrl);
    return res;
  } catch (error: any) {
    alert(`FETCH_EXCEPTION: ${error.message}`);
    throw error;
  }
}

export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/");
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    try {
      const res = await fetch(`${BASE_URL}${cleanPath}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res, cleanPath);
      return await res.json();
    } catch (error: any) {
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 0,
      retry: 0, 
    },
  },
});
