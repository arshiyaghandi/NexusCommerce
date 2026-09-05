import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { checkAuth as checkAuthFn, login as loginFn, logout as logoutFn } from '../api/auth';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await checkAuthFn();
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('nexus-logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('nexus-logout', handleLogoutEvent);
    };
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    await loginFn(username, password);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    logoutFn();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
