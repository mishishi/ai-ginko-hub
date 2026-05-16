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
      _listeners = _listeners.filter((l) => l !== favListener);
      _loadingListeners = _loadingListeners.filter((l) => l !== loadingListener);
    };
  }, [isSignedIn]);

  // Fetch favorites once (module-level guard)
  useEffect(() => {
    if (!isSignedIn || _loading) return;

    _loading = true;
    _notifyLoading();
    getToken()
      .then((token) =>
        fetch(`${API_BASE}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
      )
      .then((data: FavoriteItem[]) => {
        if (Array.isArray(data)) {
          _favorites = data;
          _notify();
        }
      })
      .catch(() => toast.error('加载收藏失败'))
      .finally(() => {
        _loading = false;
        _notifyLoading();
      });
  }, [isSignedIn, getToken]);

  const toggle = useCallback(
    async (projectId: string) => {
      if (!isSignedIn) {
        toast.error('请先登录后再收藏');
        return;
      }

      const isFav = _favorites.some((f) => f.projectId === projectId);
      const token = await getToken();

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
    [isSignedIn, getToken]
  );

  const isFavorited = useCallback(
    (projectId: string) => _favorites.some((f) => f.projectId === projectId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { isFavorited, loading: loadingSnapshot, toggle, favorites: favoritesSnapshot };
}
