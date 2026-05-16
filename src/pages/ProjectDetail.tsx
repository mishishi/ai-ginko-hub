import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects, fetchProject } from '../data/projects';
import { cardGradients } from '../data/cardGradients';
import { tagColors } from '../data/tagColors';
import type { Project } from '../types';
import { useScrollReveal } from '../hooks/useScrollReveal';

function RelatedProjectCard({ project, index, onClick }: { project: Project; index: number; onClick: () => void }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const gradient = cardGradients[index % cardGradients.length];

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'visible' : ''} group bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:border-border-accent hover:bg-bg-card-hover hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(201,125,92,0.05)] cursor-pointer active:scale-[0.98]`}
      style={{ transitionDelay: `${Math.min(index, 5) * 80}ms` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`查看项目 ${project.name}`}
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: gradient }}>
        <div aria-hidden="true" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex items-center gap-2 px-5 py-3 min-h-[44px] border border-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-[4px] translate-y-2 transition-all duration-200 group-hover:bg-white/10 group-hover:border-white/50">
            查看详情
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </span>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-heading text-base text-text-primary mb-1 leading-tight">
          {project.name}
        </h4>
        <p className="text-sm text-text-secondary line-clamp-2">
          {project.description}
        </p>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchProject(id)
      .then((p) => {
        setProject(p);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to static data
        const staticProject = projects.find((p) => p.id === id);
        setProject(staticProject || null);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!project) return;

    // Dynamic document title
    document.title = `${project.name} — Ginko Hub`;

    // Dynamic meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', project.description);
    }

    // Dynamic OG image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', project.thumbnail || `${window.location.origin}/og-default.png`);
    }

    return () => {
      document.title = 'Ginko Hub — AI 项目展示站';
    };
  }, [project]);

  // Related projects: filter by shared tags, shuffle, take 2-3
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      // eslint-disable-next-line react-hooks/purity
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const relatedProjects = useMemo(() => {
    if (!project) return [];
    return shuffle(
      projects.filter((p) => {
        if (p.id === project.id) return false;
        return p.tags.some((tag) => project.tags.includes(tag));
      })
    ).slice(0, 3);
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const isPlaceholder = project.url.includes('.example.com');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg-base focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none"
      >
        跳转到内容
      </a>

      <main id="main-content" className="flex-1">
        {/* Hero Cover Image */}
        <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: cardGradients[0] }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-base/80" />
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 min-h-[44px] bg-bg-base/80 backdrop-blur-[8px] border border-border rounded-lg text-text-secondary text-sm font-medium transition-all duration-200 hover:bg-bg-elevated hover:text-text-primary hover:border-border-hover"
            aria-label="返回项目列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            返回
          </button>
        </div>

        {/* Project Info */}
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <p className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-2">{project.createdAt}</p>
                <h1 className="font-heading text-3xl sm:text-4xl text-text-primary mb-3 leading-tight">
                  {project.name}
                </h1>
                <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
                  {project.description}
                </p>
              </div>
              {/* External Link Button */}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,125,92,0.3)] active:scale-[0.98]"
                aria-label={isPlaceholder ? `${project.name} 即将上线` : `打开项目 ${project.name}`}
              >
                {isPlaceholder ? (
                  <>即将上线</>
                ) : (
                  <>
                    打开项目
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </>
                )}
              </a>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full border border-border text-[0.75rem] font-medium text-text-secondary tracking-wide transition-all duration-200 hover:border-[var(--tag-color)] hover:text-[var(--tag-color)]"
                  style={{ '--tag-color': tagColors[tag] || '#6b6865' } as React.CSSProperties}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <section className="mb-12" aria-labelledby="related-heading">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
                <h2 id="related-heading" className="font-heading text-2xl text-text-primary">
                  相关项目
                </h2>
                <span className="text-sm text-text-muted">
                  基于共同标签推荐
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {relatedProjects.map((related, index) => (
                  <RelatedProjectCard
                    key={related.id}
                    project={related}
                    index={index}
                    onClick={() => navigate(`/project/${related.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Comments Placeholder */}
          <section className="mb-12" aria-labelledby="comments-heading">
            <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
              <h2 id="comments-heading" className="font-heading text-2xl text-text-primary">
                评论
              </h2>
              <span className="text-sm text-text-muted">
                待接入
              </span>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-text-muted text-sm">评论功能正在开发中</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
