import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "./config";

async function throwIfResNotOk(res: Response, url: string) {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error at ${url}:`, { status: res.status, text });
    throw new Error(`${res.status}: ${text.substring(0, 100)}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const fullUrl = config.getFullUrl(url);
  
  try {
    const headers = config.getContentHeaders(method !== 'GET');
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    await throwIfResNotOk(res, url);
    return res;
  } catch (error: any) {
    console.error(`Fetch exception for ${url}:`, error);
    throw error;
  }
}

export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/");
    const fullUrl = config.getFullUrl(path);
    
    try {
      const res = await fetch(fullUrl, {
        method: "GET",
        headers: config.getHeaders(false),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res, path);
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
