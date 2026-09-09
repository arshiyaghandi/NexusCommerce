import axios from 'axios';
import type {
  AuthUser,
  RegisterRequest,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types';

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
      sub: response.data.sub,
      username: response.data.username || response.data.sub || '',
      firstName: response.data.firstName || '',
      lastName: response.data.lastName || '',
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

export async function getProfile(): Promise<UserProfile> {
  const response = await axios.get<UserProfile>(`${AUTH_SERVICE_URL}/profile`, {
    withCredentials: true,
  });
  return response.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<{ message: string; firstName?: string; lastName?: string; email?: string }> {
  const response = await axios.put(`${AUTH_SERVICE_URL}/profile`, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return response.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await axios.put(`${AUTH_SERVICE_URL}/password`, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return response.data;
}
