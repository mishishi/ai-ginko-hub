import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/react';
import Header from '../components/Header';
import ProjectGrid from '../components/ProjectGrid';
import { useFavorites } from '../hooks/useFavorites';
import { API_BASE } from '../lib/api';
import type { Project } from '../types';

export default function FavoritesPage() {
  const { isSignedIn } = useAuth();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const initialFetchDone = useRef(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      window.location.href = '/';
    }
  }, [isSignedIn]);

  // Fetch project details once when favorites are loaded
  useEffect(() => {
    if (favoritesLoading || initialFetchDone.current) return;
    initialFetchDone.current = true;

    if (favorites.length === 0) {
      setProjects([]);
      setProjectsLoading(false);
      return;
    }

    const projectIds = favorites.map((f) => f.projectId);
    Promise.all(
      projectIds.map((id) =>
        fetch(`${API_BASE}/api/projects/${id}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results.filter((p): p is Project => p != null && p.id != null);
      setProjects(valid);
      setProjectsLoading(false);
    });
  }, [favorites, favoritesLoading]);

  const loading = favoritesLoading || projectsLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-heading text-3xl text-text-primary mb-6">我的收藏</h1>
          <ProjectGrid
            projects={projects}
            loading={loading}
            hasMore={false}
            loadingMore={false}
            onLoadMore={() => {}}
          />
        </div>
      </main>
    </div>
  );
}
