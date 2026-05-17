import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useFavorites } from '../hooks/useFavorites';
import { hashTagColor } from '../lib/tagColors';
import type { Project } from '../types';
import toast from 'react-hot-toast';

import { cardGradients } from '../data/cardGradients';

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

interface Props {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: Props) {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const { isFavorited, toggle } = useFavorites();
  const [toggling, setToggling] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const gradient = cardGradients[index % cardGradients.length];
  const isFav = isFavorited(project.id);

  const handleClick = useCallback(() => {
    navigate(`/project/${project.id}`);
  }, [navigate, project.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/project/${project.id}`);
      }
    },
    [navigate, project.id]
  );

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setToggling(true);
      try {
        await toggle(project.id);
      } finally {
        setToggling(false);
      }
    },
    [project.id, toggle]
  );

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} group bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:border-border-accent hover:bg-bg-card-hover hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_40px_rgba(201,125,92,0.04)] cursor-pointer active:scale-[0.98]`}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`查看项目 ${project.name}`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: gradient }}>
        {project.thumbnail && !imgError && (
          <img
            src={project.thumbnail}
            alt={project.name}
            loading="lazy"
            fetchPriority={index < 3 ? 'high' : 'low'}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100">
          <span style={{ touchAction: 'manipulation' }} className="flex items-center gap-2 px-4 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50">
            打开项目
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/projects/${project.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: project.name, url });
                } catch { /* user cancelled */ }
              } else {
                await navigator.clipboard.writeText(url);
                toast.success('链接已复制');
              }
            }}
            style={{ touchAction: 'manipulation' }}
            className="flex items-center gap-2 px-4 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50 cursor-pointer"
            aria-label="分享项目"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享
          </button>
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'manipulation' }}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50"
              aria-label={`查看 ${project.name} 源码`}
            >
              源码
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          )}
        </div>
        {project.featured && (
          <span className="badge-reveal absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-bg-base text-[0.65rem] font-semibold tracking-wider uppercase opacity-0 translate-y-[-8px] delay-300">
            精选
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[0.7rem] text-text-muted uppercase tracking-wider">{formatDate(project.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-heading text-lg text-text-primary leading-tight">
            {project.name}
          </h3>
          <button
            onClick={toggleFavorite}
            disabled={toggling}
            className={`ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-200 ${
              isFav
                ? 'text-accent hover:text-accent-dim'
                : 'text-text-muted hover:text-accent'
            }`}
            aria-label={isFav ? '取消收藏' : '添加收藏'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => {
            const { color, border, bg } = hashTagColor(tag);
            return (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigate(`/?tag=${encodeURIComponent(tag)}`);
                }}
                className="px-2.5 py-0.5 rounded-full border text-[0.6875rem] font-medium tracking-wide transition-all duration-200 cursor-pointer"
                style={{ color, borderColor: border, backgroundColor: bg }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
