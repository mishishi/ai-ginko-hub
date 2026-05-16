import { useScrollReveal } from '../hooks/useScrollReveal';
import type { Project } from '../types';

interface Props {
  project: Project;
  index: number;
}

const cardGradients = [
  'linear-gradient(135deg, #1c1a18 0%, #2a221e 50%, #1e1c1a 100%)',
  'linear-gradient(135deg, #181c1a 0%, #1e2a24 50%, #1a1e1c 100%)',
  'linear-gradient(135deg, #1a1a1e 0%, #22222a 50%, #1a1a22 100%)',
  'linear-gradient(135deg, #1e1818 0%, #2a1e1e 50%, #221a1a 100%)',
  'linear-gradient(135deg, #181e1a 0%, #1e2a20 50%, #1a221c 100%)',
  'linear-gradient(135deg, #1e1a1e 0%, #2a222a 50%, #1e1a22 100%)',
  'linear-gradient(135deg, #1a1c14 0%, #242a1e 50%, #1c1e18 100%)',
  'linear-gradient(135deg, #1e1c18 0%, #2a2620 50%, #22201c 100%)',
];

const tagColors: Record<string, string> = {
  'React': '#61dafb',
  'TypeScript': '#3178c6',
  'Next.js': '#ece8e3',
  'Vue 3': '#4fc08d',
  'AI': '#c97d5c',
  'LLM': '#a8d5ff',
  'Python': '#3776ab',
  'Stable Diffusion': '#ab7bc9',
  'D3.js': '#f9a03c',
  'Node.js': '#339933',
  'Dashboard': '#e74c3c',
  'NLP': '#2ecc71',
  'Productivity': '#f39c12',
  'VS Code': '#0078d7',
  'Developer Tools': '#6c5ce7',
  'Writing': '#e17055',
  'SaaS': '#00b894',
  'WebRTC': '#e84393',
  'Audio': '#74b9ff',
  'Education': '#fdcb6e',
  'Recommendation': '#636e72',
  'Low-Code': '#a29bfe',
  'FFmpeg': '#6ab04c',
  'Media': '#e056fd',
};

export default function ProjectCard({ project, index }: Props) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  const gradient = cardGradients[index % cardGradients.length];
  const isPlaceholder = project.url.includes('.example.com');

  const handleClick = () => {
    if (isPlaceholder) return;
    window.open(project.url, '_blank', 'noopener noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isPlaceholder) window.open(project.url, '_blank', 'noopener noreferrer');
    }
  };

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} group bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:border-border-accent hover:bg-bg-card-hover hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(201,125,92,0.05)] ${isPlaceholder ? 'opacity-60 grayscale-[0.4] cursor-not-allowed' : 'cursor-pointer'} active:scale-[0.98]`}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isPlaceholder ? -1 : 0}
      role={isPlaceholder ? 'article' : 'button'}
      aria-label={isPlaceholder ? `${project.name} — 即将上线` : `打开项目 ${project.name}`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: gradient }}>
        {/* Coming soon badge */}
        {isPlaceholder && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-4 py-2 rounded-lg border border-border text-[11px] font-medium text-text-muted tracking-wider uppercase backdrop-blur-[4px]">
              即将上线
            </span>
          </div>
        )}
        {/* Open project overlay */}
        {!isPlaceholder && (
          <div aria-hidden="true" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex items-center gap-2 px-5 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50">
              打开项目
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </div>
        )}
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
