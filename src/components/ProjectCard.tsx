import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import type { Project } from '../types';

interface Props {
  project: Project;
  index: number;
}

import { cardGradients } from '../data/cardGradients';
import { tagColors } from '../data/tagColors';

export default function ProjectCard({ project, index }: Props) {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  const gradient = cardGradients[index % cardGradients.length];

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/project/${project.id}`);
    }
  };

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} group bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:border-border-accent hover:bg-bg-card-hover hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(201,125,92,0.05)] cursor-pointer active:scale-[0.98]`}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`查看项目 ${project.name}`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: gradient }}>
        {project.thumbnail && (
          <img
            src={project.thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex items-center gap-2 px-5 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50">
            打开项目
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
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
          <span className="text-[0.7rem] text-text-muted uppercase tracking-wider">{project.createdAt}</span>
        </div>
        <h3 className="font-heading text-lg text-text-primary mb-1.5 leading-tight">
          {project.name}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full border border-border text-[0.6875rem] font-medium text-text-secondary tracking-wide transition-all duration-200 hover:border-[var(--tag-color)] hover:text-[var(--tag-color)]"
              style={{ '--tag-color': tagColors[tag] || '#6b6865' } as React.CSSProperties}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
