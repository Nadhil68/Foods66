/**
 * Centralized API client with JWT auto-attachment, error handling, and 401 auto-logout.
 * All API calls should go through this module.
 */

// Dynamic API base URL: Uses VITE_API_URL if configured, otherwise defaults to
// relative '/api' in production (conforming to Vercel's multi-service rewrites),
// or local dev server on port 5000.
const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (rawApiUrl !== undefined && rawApiUrl.trim() !== '')
  ? rawApiUrl.trim()
  : (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const AUTH_TOKEN_KEY = 'auth_token';

function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Extract a user-friendly error message from an API response.
 * Never exposes raw server internals to the user.
 */
async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
  } catch {
    // response body wasn't valid JSON
  }

  // Fallback messages by status code
  switch (response.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Authentication required. Please sign in.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'A conflict occurred. The resource may already exist.';
    case 429: return 'Too many requests. Please try again later.';
    default: return 'An unexpected error occurred. Please try again.';
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
}

/**
 * Core fetch wrapper.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false, timeout = 10000 } = options;

  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  // Auto-attach JWT unless explicitly skipped
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set content-type for JSON bodies (not for FormData)
  if (body && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    throw new ApiError('Unable to connect to the server. Please check your internet connection or ensure the server is running.', 0);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorMessage = await extractError(response);

    // Auto-clear auth on 401 (token expired/invalid)
    if (response.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('auth_user');
    }

    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

/** Convenience methods */
export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

/** Export the base URL for use by other services (e.g., socket, uploads) */
export const API_BASE_URL = API_URL;

/** Raw base URL without /api for socket connections */
export const getBaseUrl = (): string => {
  const url = API_URL;
  if (!url || url === '/api') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  // Strip trailing /api if present
  const base = url.replace(/\/api\/?$/, '');
  return base || (typeof window !== 'undefined' ? window.location.origin : '');
};

/**
 * Resolves a food image path to a usable URL.
 * - Absolute URLs (http/https) are returned unchanged.
 * - Legacy localhost URLs (http://localhost:5000/...) are converted to relative paths.
 * - Relative paths starting with /uploads/ are returned as-is; Vite proxies them in dev
 *   and Vercel/reverse proxies handle them in production.
 * - All other relative paths (e.g. /images/food/...) are returned unchanged.
 */
export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  // Normalize legacy localhost URLs to clean relative paths
  if (path.startsWith('http://localhost:5000/') || path.startsWith('http://127.0.0.1:5000/')) {
    return path.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, '');
  }
  return path;
};


