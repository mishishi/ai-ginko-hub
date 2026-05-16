import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProject, fetchProjects } from '../data/projects';
import { cardGradients } from '../data/cardGradients';
import Header from '../components/Header';
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
        {project.thumbnail && (
          <img src={project.thumbnail} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        )}
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
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchProject(id), fetchProjects()])
      .then(([p, all]) => {
        setProject(p);
        setAllProjects(all.projects);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
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
      ogImage.setAttribute('content', project.thumbnail || `${window.location.origin}/og-image.svg`);
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
      allProjects.filter((p) => {
        if (p.id === project.id) return false;
        return p.tags.some((tag) => project.tags.includes(tag));
      })
    ).slice(0, 3);
  }, [project, allProjects]);

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg-base focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none"
      >
        跳转到内容
      </a>

      <Header />

      <main id="main-content" className="relative flex-1">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Thumbnail — left on desktop, top on mobile */}
              {project.thumbnail && (
                <div className="flex-shrink-0">
                  <img
                    src={project.thumbnail}
                    alt=""
                    loading="lazy"
                    className="w-full sm:w-[120px] h-[200px] sm:h-[75px] object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-[0.7rem] text-text-muted uppercase tracking-wider">{project.createdAt}</p>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-accent transition-colors duration-200 hover:text-accent-dim cursor-pointer"
                        aria-label={`打开项目 ${project.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                        打开
                      </a>
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200"
                          aria-label={`查看 ${project.name} 源码`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          源码
                        </a>
                      )}
                    </div>
                    <h1 className="font-heading text-3xl sm:text-4xl text-text-primary mb-3 leading-tight">
                      {project.name}
                    </h1>
                    <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
                      {project.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <h2 className="sr-only">标签</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => {
                const key = tag.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
                return (
                  <span
                    key={tag}
                    data-tag={key}
                    className="px-3 py-1 rounded-full border text-[0.75rem] font-medium tracking-wide transition-all duration-200"
                    style={{
                      color: `var(--color-tag-${key})`,
                      borderColor: `var(--color-tag-${key}-border)`,
                      backgroundColor: `var(--color-tag-${key}-bg)`,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
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
