import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import ProjectGrid from '../components/ProjectGrid';
import { fetchProjects } from '../data/projects';
import type { Project } from '../types';

const PAGE_SIZE = 12;

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get('q') || ''
  );
  const [activeTag, setActiveTag] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('tag') || null
  );
  const isPopStateRef = useRef(false);
  const isInitialMount = useRef(true);

  // Initial load — fetch first page only
  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(undefined, undefined, PAGE_SIZE, 0, controller.signal)
      .then(({ projects: data, total: totalCount }) => {
        setProjects(data);
        setHasMore(data.length < totalCount);
        setPage(1);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Reload when filter/search changes — reset pagination
  useEffect(() => {
    // Skip fetch on initial mount; the initial-load effect handles it.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setPage(0);
    setHasMore(true);
    fetchProjects(activeTag || undefined, searchQuery || undefined, PAGE_SIZE, 0, controller.signal)
      .then(({ projects: data, total: totalCount }) => {
        setProjects(data);
        setHasMore(data.length < totalCount);
        setPage(1);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [activeTag, searchQuery]);

  const loadMore = useCallback(async () => {
    const currentLoadingMore = loadingMore;
    const currentHasMore = hasMore;
    if (currentLoadingMore || !currentHasMore) return;
    setLoadingMore(true);
    const offset = page * PAGE_SIZE;
    try {
      const { projects: data, total: totalCount } = await fetchProjects(
        activeTag || undefined,
        searchQuery || undefined,
        PAGE_SIZE,
        offset
      );
      setProjects((prev) => {
        setHasMore(prev.length + data.length < totalCount);
        return [...prev, ...data];
      });
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [page, activeTag, searchQuery]);

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
          p.description.toLowerCase().includes(q)
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
          <section className="relative text-center pt-16 sm:pt-24 pb-10 sm:pb-16">
            {/* Ambient glow */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] opacity-[0.07]" style={{ background: 'radial-gradient(ellipse at center, #c97d5c 0%, transparent 70%)' }} />
            </div>

            <h1 className="hero-animate font-heading text-[clamp(2rem,5vw,4rem)] font-medium tracking-tight text-text-primary mb-3 sm:mb-4">
              AI <span className="text-accent italic">项目集</span>
            </h1>
            <p className="hero-animate max-w-lg mx-auto mb-6 sm:mb-10 text-sm sm:text-base leading-relaxed text-text-muted">
              通过 AI 辅助开发的 Web 项目合集 &mdash; 从概念到部署，每一次迭代都是探索。
            </p>

            {/* Stats */}
            <div className="hero-animate">
              <div className="inline-flex items-center gap-4 sm:gap-8 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl border border-border bg-bg-card/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-accent leading-none tabular-nums">{projects.length}</span>
                  <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">总项目</span>
                </div>
                <div className="w-px h-8 sm:h-11 bg-border" />
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-accent leading-none tabular-nums">{featuredCount}</span>
                  <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">精选项目</span>
                </div>
                <div className="w-px h-8 sm:h-11 bg-border" />
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <span className="font-heading text-[1.5rem] sm:text-[1.75rem] text-accent leading-none tabular-nums">
                    {new Set(projects.flatMap((p) => p.tags)).size}
                  </span>
                  <span className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest">技术栈</span>
                </div>
              </div>
            </div>

            {/* Decorative divider */}
            <div aria-hidden="true" className="mt-10 sm:mt-12 flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-border" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-60" />
              <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-border" />
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
          <ProjectGrid
            projects={filtered}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      </main>

      <footer className="border-t border-border py-10 mt-auto">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
            {/* Brand */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="6" fill="#c97d5c" opacity="0.15" />
                  <path d="M16 6C12 6 8 10 8 14c0 4 2 6 4 8l4 4 4-4c2-2 4-4 4-8 0-4-4-8-8-8z" fill="#c97d5c" opacity="0.9" />
                  <path d="M16 10c-2 0-4 2-4 4s1.5 3 2.5 4L16 20l1.5-2c1-1 2.5-2 2.5-4s-2-4-4-4z" fill="#ece8e3" opacity="0.85" />
                </svg>
                <span className="font-heading text-base text-text-primary">Ginko Hub</span>
              </div>
              <p className="text-xs text-text-muted max-w-[220px] leading-relaxed">
                AI 辅助开发的 Web 项目展示站，记录每一次从概念到部署的探索。
              </p>
            </div>

            {/* Navigation */}
            <nav aria-label="页脚导航" className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Link to="/" className="text-xs text-text-muted hover:text-accent transition-colors duration-200">项目</Link>
              <Link to="/about" className="text-xs text-text-muted hover:text-accent transition-colors duration-200">关于</Link>
              <a
                href="https://github.com/mishishi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-accent transition-colors duration-200"
              >
                GitHub
              </a>
              <a
                href="https://ginko-hub.example.com/sitemap.xml"
                className="text-xs text-text-muted hover:text-accent transition-colors duration-200"
              >
                Sitemap
              </a>
            </nav>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-text-muted tracking-wide">
              &copy; {new Date().getFullYear()} Ginko Hub &mdash; Built with AI
            </p>
            <p className="text-[11px] text-text-muted tracking-wide">
              Made with React &amp; Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
