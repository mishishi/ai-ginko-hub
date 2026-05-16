import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import Header from '../components/Header';
import ProjectGrid from '../components/ProjectGrid';
import { API_BASE } from '../lib/api';
import type { Project } from '../types';

export default function FavoritesPage() {
  const { isSignedIn } = useAuth();
  const { getToken } = useUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }
    getToken().then((token) => {
      fetch(`${API_BASE}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(async (favorites: { projectId: string }[]) => {
          if (!Array.isArray(favorites) || favorites.length === 0) {
            setProjects([]);
            return;
          }
          const projectIds = favorites.map((f) => f.projectId);
          const allProjects: Project[] = [];
          for (const id of projectIds) {
            try {
              const p = await fetch(`${API_BASE}/api/projects/${id}`).then((r) => r.json());
              if (p && p.id) allProjects.push(p);
            } catch {}
          }
          setProjects(allProjects);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [isSignedIn, getToken, navigate]);

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
