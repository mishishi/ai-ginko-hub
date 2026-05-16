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
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-bg-card border border-border rounded-xl h-48 animate-pulse" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-24">
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
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* Grid closing tag */}
      </div>
  );
}
