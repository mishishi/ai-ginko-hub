import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/react';
import toast from 'react-hot-toast';
import { API_BASE } from '../lib/api';

export interface FavoriteItem {
  id: string;
  projectId: string;
  createdAt: number;
}

const STORAGE_KEY = 'ginko_favorites';

// Module-level singleton — shared across all hook instances
let _favorites: FavoriteItem[] = [];
let _loading = false;
let _fetchedForUserId: string | null = null; // Track which user we've fetched for
let _fetchPromise: Promise<unknown> | null = null; // In-flight fetch to share across instances
let _listeners: Array<(favs: FavoriteItem[]) => void> = [];
let _loadingListeners: Array<(loading: boolean) => void> = [];
let _toggleInflight = new Set<string>(); // Prevent rapid toggles for same projectId
let _storageListenerActive = false;

// Initialize _favorites from localStorage at module load
_favorites = _loadFromStorage();

function _loadFromStorage(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function _saveToStorage(favs: FavoriteItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

function _notify() {
  _saveToStorage(_favorites);
  for (const cb of _listeners) cb([..._favorites]);
}

function _notifyLoading() {
  for (const cb of _loadingListeners) cb(_loading);
}

// Set up cross-tab storage listener once globally
function _setupStorageListener() {
  if (_storageListenerActive) return;
  _storageListenerActive = true;
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || e.newValue === null) return;
    try {
      const incoming = JSON.parse(e.newValue) as FavoriteItem[];
      if (!Array.isArray(incoming)) return;
      _favorites = incoming;
      _notify();
    } catch {
      // ignore parse errors
    }
  });
}

async function _handleUnauthorized(signOutFn: () => Promise<void>) {
  toast.error('登录已过期，请重新登录');
  await signOutFn();
}

export function useFavorites() {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<FavoriteItem[]>(_favorites);
  const [loadingSnapshot, setLoadingSnapshot] = useState(_loading);

  // Stabilize getToken — Clerk's hook returns an unstable reference
  const stableGetToken = useCallback(() => getToken(), [getToken]);

  useEffect(() => {
    if (!isSignedIn) {
      setFavoritesSnapshot([]);
      setLoadingSnapshot(false);
      // Reset all module-level state so next user gets a fresh session
      _favorites = [];
      _loading = false;
      _fetchedForUserId = null;
      _fetchPromise = null;
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Set up cross-tab sync listener once
    _setupStorageListener();

    // Register listeners for updates
    const favListener = (favs: FavoriteItem[]) => setFavoritesSnapshot([...favs]);
    const loadingListener = (loading: boolean) => setLoadingSnapshot(loading);
    _listeners.push(favListener);
    _loadingListeners.push(loadingListener);
    setFavoritesSnapshot([..._favorites]);
    setLoadingSnapshot(_loading);

    return () => {
      _listeners.splice(_listeners.indexOf(favListener), 1);
      _loadingListeners.splice(_loadingListeners.indexOf(loadingListener), 1);
    };
  }, [isSignedIn]);

  // Fetch favorites once — join in-flight fetch if one exists, avoid duplicate requests
  useEffect(() => {
    if (!isSignedIn) return;

    // If already fetched for this user, notify with cached data and done
    if (_fetchedForUserId) {
      _notify();
      _notifyLoading();
      return;
    }

    // If a fetch is already in-flight, wait for it instead of starting another
    if (_fetchPromise) {
      _loading = true;
      _notifyLoading();
      _fetchPromise.then(() => {
        _loading = false;
        _notifyLoading();
      });
      return;
    }

    // First caller — start fetch
    _loading = true;
    _notifyLoading();

    _fetchPromise = stableGetToken().then((token) => {
      if (_fetchedForUserId === token) return;

      return fetch(`${API_BASE}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (r) => {
          if (r.status === 401) {
            await _handleUnauthorized(signOut);
            return [];
          }
          return r.json();
        })
        .then((data: FavoriteItem[]) => {
          if (Array.isArray(data)) {
            _favorites = data;
            _fetchedForUserId = token;
            _notify();
          }
        })
        .catch(() => toast.error('加载收藏失败'))
        .finally(() => {
          _loading = false;
          _fetchPromise = null;
          _notifyLoading();
        });
    });
  }, [isSignedIn, stableGetToken]);

  const toggle = useCallback(
    async (projectId: string) => {
      if (!isSignedIn) {
        toast.error('请先登录后再收藏');
        return;
      }

      // Debounce: ignore if a toggle for this projectId is already in-flight
      if (_toggleInflight.has(projectId)) return;
      _toggleInflight.add(projectId);

      const isFav = _favorites.some((f) => f.projectId === projectId);
      const token = await stableGetToken();

      // Optimistic update
      if (isFav) {
        _favorites = _favorites.filter((f) => f.projectId !== projectId);
      } else {
        _favorites = [
          ..._favorites,
          { id: `temp-${projectId}`, projectId, createdAt: Date.now() },
        ];
      }
      _notify();

      try {
        if (isFav) {
          const res = await fetch(`${API_BASE}/api/favorites/${projectId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            await _handleUnauthorized(signOut);
            return;
          }
          toast.success('已取消收藏');
        } else {
          const res = await fetch(`${API_BASE}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ projectId }),
          });
          if (res.status === 401) {
            await _handleUnauthorized(signOut);
            return;
          }
          const newFav = await res.json();
          // Replace temp entry with real one
          _favorites = _favorites.map((f) =>
            f.projectId === projectId && f.id.startsWith('temp-')
              ? { id: newFav.id, projectId, createdAt: newFav.createdAt }
              : f
          );
          _notify();
          toast.success('已收藏');
        }
      } catch {
        // Revert on failure — re-fetch
        const revertRes = await fetch(`${API_BASE}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (revertRes.status === 401) {
          await _handleUnauthorized(signOut);
          return;
        }
        const data = await revertRes.json();
        if (Array.isArray(data)) {
          _favorites = data;
        } else {
          // Restore original state
          if (isFav) {
            _favorites = [..._favorites, { id: `temp-${projectId}`, projectId, createdAt: Date.now() }];
          }
        }
        _notify();
        toast.error('操作失败，请重试');
      } finally {
        _toggleInflight.delete(projectId);
      }
    },
    [isSignedIn, stableGetToken]
  );

  const isFavorited = useCallback(
    (projectId: string) => _favorites.some((f) => f.projectId === projectId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { isFavorited, loading: loadingSnapshot, toggle, favorites: favoritesSnapshot };
}
