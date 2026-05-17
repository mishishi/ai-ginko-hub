import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import ProjectGrid from '../components/ProjectGrid';
import { useFavorites } from '../hooks/useFavorites';
import { API_BASE } from '../lib/api';
import type { Project } from '../types';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/', { replace: true });
    }
  }, [isSignedIn, navigate]);

  // Fetch project details once when favorites are loaded
  useEffect(() => {
    if (favoritesLoading) return;

    if (favorites.length === 0) {
      setProjects([]);
      setProjectsError(null);
      setProjectsLoading(false);
      return;
    }

    setProjectsError(null);
    setProjectsLoading(true);
    const projectIds = favorites.map((f) => f.projectId);

    fetch(`${API_BASE}/api/projects/batch?ids=${projectIds.join(',')}`, {
      signal: AbortSignal.timeout(30000),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.projects)) {
          setProjects(data.projects as Project[]);
        } else {
          setProjects([]);
        }
      })
      .catch(() => {
        setProjects([]);
        setProjectsError('无法加载收藏项目，请稍后重试');
        toast.error('加载收藏项目失败，请稍后重试');
      })
      .finally(() => {
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
          {projectsError && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {projectsError}
            </div>
          )}
          {!loading && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted mb-4" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <p className="font-heading text-xl text-text-primary mb-2">暂无收藏</p>
              <p className="text-sm text-text-muted mb-6">去首页探索感兴趣的项目吧</p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-accent text-bg-base rounded-lg text-sm font-medium hover:bg-accent-dim transition-colors cursor-pointer"
              >
                浏览项目
              </button>
            </div>
          )}
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
