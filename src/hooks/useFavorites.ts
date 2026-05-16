import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/react';
import toast from 'react-hot-toast';
import { API_BASE } from '../lib/api';

export interface FavoriteItem {
  id: string;
  projectId: string;
  createdAt: number;
}

// Module-level singleton — shared across all hook instances
let _favorites: FavoriteItem[] = [];
let _loading = false;
let _fetchLock = true; // Start locked — only first caller unlocks after fetch
let _fetchedForUserId: string | null = null; // Track which user we've fetched for
let _fetchPromise: Promise<void> | null = null; // In-flight fetch to share across instances
let _listeners: Array<(favs: FavoriteItem[]) => void> = [];
let _loadingListeners: Array<(loading: boolean) => void> = [];

function _notify() {
  for (const cb of _listeners) cb([..._favorites]);
}

function _notifyLoading() {
  for (const cb of _loadingListeners) cb(_loading);
}

export function useFavorites() {
  const { isSignedIn, getToken } = useAuth();
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<FavoriteItem[]>(_favorites);
  const [loadingSnapshot, setLoadingSnapshot] = useState(_loading);

  // Stabilize getToken — Clerk's hook returns an unstable reference
  const stableGetToken = useCallback(() => getToken(), [getToken]);

  useEffect(() => {
    if (!isSignedIn) {
      setFavoritesSnapshot([]);
      setLoadingSnapshot(false);
      return;
    }

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

    // First caller — acquire lock and start fetch
    _fetchLock = false; // allow other callers to fall through above
    _loading = true;
    _notifyLoading();

    _fetchPromise = stableGetToken().then((token) => {
      if (_fetchedForUserId === token) return;

      return fetch(`${API_BASE}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
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
          _fetchLock = true; // reset lock
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
          await fetch(`${API_BASE}/api/favorites/${projectId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('已取消收藏');
        } else {
          const res = await fetch(`${API_BASE}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ projectId }),
          });
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
        const data = await fetch(`${API_BASE}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());
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
