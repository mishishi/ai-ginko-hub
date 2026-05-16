import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'admin_token';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

function getInitialAuthState(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { token: null, username: null, isLoading: false };
  }
  return { token, username: null, isLoading: true };
}

export function useAdminAuth() {
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

  return { ...auth, login, logout };
}
