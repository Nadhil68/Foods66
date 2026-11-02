/**
 * Authentication service — handles registration, login, logout,
 * and token/user persistence in localStorage.
 */

import { apiClient } from './apiClient';
import type { AuthUser, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ── Persistence ──────────────────────────────────────────────

export function storeAuth(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to persist auth data', e);
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── API Calls ────────────────────────────────────────────────

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/users/register', data, { skipAuth: true });
  storeAuth(response.token, response.user);
  return response;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/users/login', data, { skipAuth: true });
  storeAuth(response.token, response.user);
  return response;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>('/users/me');
  return response.user;
}

export function logout(): void {
  clearAuth();
}
