import axios from 'axios';
import type { AuthUser, RegisterRequest } from '../types';

axios.defaults.withCredentials = true;

const AUTH_SERVICE_URL = '/api/auth';

export async function login(username: string, password: string): Promise<void> {
  await axios.post(`${AUTH_SERVICE_URL}/login`, { username, password }, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
}

export async function refreshToken(): Promise<string | null> {
  return null;
}

export function logout(): void {
  axios.post(`${AUTH_SERVICE_URL}/logout`, {}, { withCredentials: true }).finally(() => {
    window.dispatchEvent(new Event('nexus-logout'));
  });
}

export async function checkAuth(): Promise<AuthUser | null> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/me`, { withCredentials: true });
    if (!response.data || response.data.error) {
      return null;
    }
    return {
      name: response.data.name || 'User',
      email: response.data.email || '',
      roles: Array.isArray(response.data.roles) ? response.data.roles : [],
    };
  } catch {
    return null;
  }
}

export async function register(data: RegisterRequest): Promise<{ message: string }> {
  const response = await axios.post(`${AUTH_SERVICE_URL}/register`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
}
