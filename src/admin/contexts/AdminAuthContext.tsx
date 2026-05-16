import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../../lib/api';

const TOKEN_KEY = 'admin_token';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

interface AdminAuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function getInitialAuthState(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { token: null, username: null, isLoading: false };
  }
  return { token, username: null, isLoading: true };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialAuthState);

  // Verify token on mount
  useEffect(() => {
    if (!auth.token) {
      return;
    }

    let cancelled = false;

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setAuth({
          token: auth.token,
          username: data?.username || null,
          isLoading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setAuth({ token: null, username: null, isLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setAuth({ token: data.token, username: data.username, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuth({ token: null, username: null, isLoading: false });
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
