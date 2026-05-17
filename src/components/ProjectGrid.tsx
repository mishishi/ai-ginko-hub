import { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';
import ProjectCard from './ProjectCard';

interface Props {
  projects: Project[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function ProjectGrid({ projects, loading, hasMore, loadingMore, onLoadMore }: Props) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const wasLoading = useRef(false);

  // 仅在首次加载完成（loading: true → false）时触发动画一次
  useEffect(() => {
    if (wasLoading.current && !loading && !hasAnimated) {
      const grid = document.querySelector<HTMLElement>('.project-grid-animated');
      if (grid) {
        grid.classList.remove('animate-fade-in');
        void grid.offsetWidth;
        grid.classList.add('animate-fade-in');
      }
      setHasAnimated(true);
    }
    wasLoading.current = !loading;
  }, [loading, hasAnimated]);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-xl overflow-hidden animate-pulse">
            {/* Thumbnail */}
            <div className="aspect-[16/10] bg-bg-elevated" />
            {/* Body */}
            <div className="p-4 pb-6 space-y-3">
              <div className="h-2 w-16 rounded bg-bg-elevated" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 rounded bg-bg-elevated" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-bg-elevated" />
                <div className="h-3 w-3/4 rounded bg-bg-elevated" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-bg-elevated" />
                <div className="h-5 w-12 rounded-full bg-bg-elevated" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-20 text-center text-text-muted">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 mb-6" aria-hidden="true">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <p className="text-sm sm:text-base mb-2 text-text-secondary">没有匹配的项目</p>
        <span className="text-xs sm:text-sm">试试其他筛选条件</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-24 project-grid-animated">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
        />
      ))}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="col-span-full flex justify-center pt-8">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-label="加载更多项目"
            aria-busy={loadingMore}
            className="px-6 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* Grid closing tag */}
      </div>
  );
}
