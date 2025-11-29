import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Store wallet address globally for API requests
let currentWalletAddress: string | null = null;

export function setWalletAddress(address: string | null) {
  currentWalletAddress = address;
}

export function getStoredWalletAddress(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("walletAddress");
  }
  return null;
}

// Initialize from localStorage
if (typeof window !== 'undefined') {
  currentWalletAddress = getStoredWalletAddress();
}

function getHeaders(includeContentType: boolean = false): HeadersInit {
  const headers: Record<string, string> = {};
  
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  if (currentWalletAddress) {
    headers["X-Wallet-Address"] = currentWalletAddress;
  }
  
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = '';
    try {
      const json = await res.json();
      errorText = json.error || JSON.stringify(json);
    } catch {
      errorText = await res.text() || res.statusText;
    }
    const error = new Error(`${res.status}: ${errorText}`);
    console.error("API Error:", error);
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  console.log(`[API] ${method} ${url}`, data);
  try {
    const res = await fetch(url, {
      method,
      headers: getHeaders(!!data),
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`[API] Response status: ${res.status}`);
    await throwIfResNotOk(res);
    const json = await res.json();
    console.log(`[API] Response body:`, json);
    return json;
  } catch (error) {
    console.error(`[API] Request failed:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      headers: getHeaders(),
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
