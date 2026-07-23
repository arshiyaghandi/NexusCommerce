import axios from 'axios';
import type { AuthUser, RegisterRequest } from '../types';

const KEYCLOAK_URL = 'http://localhost:8081/realms/nexus-realm/protocol/openid-connect/token';
const AUTH_SERVICE_URL = '/api/auth';
const CLIENT_ID = 'nexus-auth-client';
const CLIENT_SECRET = 'ICdEmE4XwvcC1HMLydpsuYwUh9pp0eHm';

export async function login(username: string, password: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post(KEYCLOAK_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);
}

export async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;

  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh);

    const response = await axios.post(KEYCLOAK_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const newAccessToken = response.data.access_token;
    localStorage.setItem('access_token', newAccessToken);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    return newAccessToken;
  } catch {
    logout();
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

export function checkAuth(): AuthUser | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    const roles: string[] = payload.realm_access?.roles?.map((r: string) => `ROLE_${r.toUpperCase()}`) || [];
    return {
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles,
    };
  } catch {
    return null;
  }
}

export async function register(data: RegisterRequest & { recaptchaToken?: string }): Promise<{ message: string }> {
  const response = await axios.post(`${AUTH_SERVICE_URL}/register`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}
