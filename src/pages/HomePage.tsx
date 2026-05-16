import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import ProjectGrid from '../components/ProjectGrid';
import { projects as staticProjects } from '../data/projects';
import { fetchProjects } from '../data/projects';
import type { Project } from '../types';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') || ''
  );
  const [activeTag, setActiveTag] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('tag') || null
  );
  const isPopStateRef = useRef(false);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => {
        setProjects(staticProjects);
        setLoading(false);
      });
  }, []);

  // Sync filter state to URL — pushState so back/forward navigation works
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeTag) params.set('tag', activeTag);
    const url = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.pushState(null, '', url);
  }, [searchQuery, activeTag]);

  // Restore filter state on browser back/forward
  useEffect(() => {
    const onPopState = () => {
      isPopStateRef.current = true;
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') || '');
      setActiveTag(params.get('tag') || null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const filtered = useMemo(() => {
    let result = projects;

    if (activeTag) {
      result = result.filter((p) => p.tags.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [projects, searchQuery, activeTag]);

  const featuredCount = projects.filter((p) => p.featured).length;
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content — keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg-base focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none"
      >
        跳转到内容
      </a>

      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="text-center pt-16 sm:pt-24 pb-10 sm:pb-16">
            <h1 className="hero-animate font-heading text-[clamp(2rem,5vw,4rem)] font-medium tracking-tight text-text-primary mb-3 sm:mb-4">
              AI <span className="text-accent italic">项目集</span>
            </h1>
            <p className="hero-animate max-w-lg mx-auto mb-6 sm:mb-10 text-sm sm:text-base leading-relaxed text-text-muted">
              通过 AI 辅助开发的 Web 项目合集 &mdash; 从概念到部署，每一次迭代都是探索。
            </p>
            <div className="hero-animate flex items-center justify-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-text-primary leading-none">{projects.length}</span>
                <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">总项目</span>
              </div>
              <div className="w-px h-6 sm:h-10 bg-border" />
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-text-primary leading-none">{featuredCount}</span>
                <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">精选项目</span>
              </div>
              <div className="w-px h-6 sm:h-10 bg-border" />
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-text-primary leading-none">
                  {new Set(projects.flatMap((p) => p.tags)).size}
                </span>
                <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">技术栈</span>
              </div>
            </div>
          </section>

          {/* Filter */}
          <FilterBar
            tags={allTags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
          />

          {/* Section Header */}
          <div className="flex items-baseline gap-3 mb-8 pb-4 border-b border-border">
            <h2 className="font-heading text-2xl text-text-primary">
              {activeTag ? activeTag : '全部项目'}
            </h2>
            <span
              className={`text-sm text-text-muted ${!(searchQuery || activeTag) ? 'sr-only' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              找到 {filtered.length} 个结果
            </span>
          </div>

          {/* Project Grid */}
          <ProjectGrid projects={filtered} loading={loading} />
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            {/* Logo + tagline */}
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="#c97d5c" opacity="0.15" />
                <path d="M16 6C12 6 8 10 8 14c0 4 2 6 4 8l4 4 4-4c2-2 4-4 4-8 0-4-4-8-8-8z" fill="#c97d5c" opacity="0.9" />
                <path d="M16 10c-2 0-4 2-4 4s1.5 3 2.5 4L16 20l1.5-2c1-1 2.5-2 2.5-4s-2-4-4-4z" fill="#ece8e3" opacity="0.85" />
              </svg>
              <span className="font-heading text-sm text-text-secondary">Ginko Hub</span>
            </div>
            {/* Social links */}
            <nav aria-label="页脚链接">
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors duration-200"
                aria-label="GitHub 主页"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
                <Link to="/about" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors duration-200">
                  关于
                </Link>
              </div>
            </nav>
          </div>
          <p className="text-center text-[11px] text-text-muted tracking-wide">
            &copy; {new Date().getFullYear()} Ginko Hub &mdash; Built with AI
          </p>
        </div>
      </footer>
    </div>
  );
}
