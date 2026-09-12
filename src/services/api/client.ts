import { env } from '@/config/env';
import { storageDeleteItem, storageGetItem, storageSetItem } from '@/lib/storage';
import { ApiError, type ApiErrorResponse } from '@/types/api';

const ACCESS_TOKEN_KEY = 'dars_access_token';
const REFRESH_TOKEN_KEY = 'dars_refresh_token';

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  skipRefresh?: boolean;
};

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export async function getAccessToken() {
  if (memoryAccessToken) return memoryAccessToken;
  memoryAccessToken = await storageGetItem(ACCESS_TOKEN_KEY);
  return memoryAccessToken;
}

export async function getRefreshToken() {
  if (memoryRefreshToken) return memoryRefreshToken;
  memoryRefreshToken = await storageGetItem(REFRESH_TOKEN_KEY);
  return memoryRefreshToken;
}

export async function setTokens(accessToken: string, refreshToken: string) {
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;
  await storageSetItem(ACCESS_TOKEN_KEY, accessToken);
  await storageSetItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  await storageDeleteItem(ACCESS_TOKEN_KEY);
  await storageDeleteItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return null;
    }

    const json = (await response.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    await setTokens(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, headers = {}, skipRefresh = false } = options;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Check your connection.',
      0,
    );
  }

  if (response.status === 401 && auth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const text = await response.text();
  let json: T | ApiErrorResponse;
  try {
    json = text ? (JSON.parse(text) as T | ApiErrorResponse) : ({} as T);
  } catch {
    throw new ApiError(
      'INVALID_RESPONSE',
      `Unexpected response from server (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = json as ApiErrorResponse;
    throw new ApiError(
      errorBody.error?.code ?? 'REQUEST_FAILED',
      errorBody.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return json as T;
}
