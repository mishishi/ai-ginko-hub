import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../../lib/api';

interface AuthState {
  username: string | null;
  isLoading: boolean;
}

interface AdminAuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ username: null, isLoading: true });

  // Verify session on mount
  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setAuth({ username: data?.username || null, isLoading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setAuth({ username: null, isLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setAuth({ username: data.username, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setAuth({ username: null, isLoading: false });
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
