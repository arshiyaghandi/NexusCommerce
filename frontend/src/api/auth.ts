import axios from 'axios';
import type { AuthUser, RegisterRequest } from '../types';

const AUTH_SERVICE_URL = '/api/auth';

export async function login(username: string, password: string): Promise<void> {
  await axios.post(`${AUTH_SERVICE_URL}/login`, { username, password }, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function refreshToken(): Promise<string | null> {
  return null;
}

export function logout(): void {
  axios.post(`${AUTH_SERVICE_URL}/logout`).finally(() => {
    window.dispatchEvent(new Event('nexus-logout'));
  });
}

export async function checkAuth(): Promise<AuthUser | null> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/me`);
    if (response.data.error) {
      return null;
    }
    return response.data as AuthUser;
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
