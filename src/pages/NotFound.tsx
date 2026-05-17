import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { API_BASE } from '../lib/api';
import type { Project } from '../types';
import { cardGradients } from '../data/cardGradients';
import { hashTagColor } from '../lib/tagColors';
import Header from '../components/Header';

export default function NotFound() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [searching, setSearching] = useState(false);
  const [popularProjects, setPopularProjects] = useState<Project[]>([]);
  const [, setLoadingPopular] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch popular projects on mount
  useEffect(() => {
    async function fetchPopular() {
      try {
        const res = await fetch(`${API_BASE}/api/projects?sort=views&limit=6`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: Project[] = await res.json();
        setPopularProjects(data);
        // Extract all unique tags
        const tags = Array.from(new Set(data.flatMap((p) => p.tags)));
        setAllTags(tags);
      } catch {
        toast.error('加载热门项目失败');
      } finally {
        setLoadingPopular(false);
      }
    }
    fetchPopular();
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects?q=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Project[] = await res.json();
      setSearchResults(data);
    } catch {
      toast.error('搜索失败');
    } finally {
      setSearching(false);
    }
  }, [query]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Area */}
        <section className="px-4 pt-16 pb-12 text-center">
          <div
            className="font-heading text-[12rem] leading-none text-text-muted/20 select-none mb-[-2rem]"
            aria-hidden="true"
          >
            404
          </div>
          <h1 className="font-heading text-3xl text-text-primary mb-4">页面未找到</h1>
          <p className="text-text-secondary mb-8 max-w-sm mx-auto">
            你访问的页面不存在或已被移除，试试搜索或浏览热门项目。
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索项目..."
                className="w-full px-5 py-3.5 pr-14 bg-bg-card border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-accent transition-colors disabled:opacity-50"
                aria-label="搜索"
              >
                {searching ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <ul className="max-w-xl mx-auto mb-12 space-y-2">
              {searchResults.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/project/${project.id}`}
                    className="flex items-center gap-3 px-4 py-3 bg-bg-card border border-border rounded-xl hover:border-border-accent hover:bg-bg-card-hover transition-colors group"
                  >
                    <span className="flex-1 font-medium text-text-primary group-hover:text-accent transition-colors">
                      {project.name}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-accent transition-colors" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && searchResults.length === 0 && !searching && (
            <p className="max-w-xl mx-auto mb-12 text-text-muted text-sm">未找到相关项目</p>
          )}
        </section>

        {/* Popular Projects */}
        {popularProjects.length > 0 && (
          <section className="px-4 pb-12">
            <h2 className="font-heading text-xl text-text-primary mb-6 text-center">热门项目</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {popularProjects.map((project, i) => {
                const gradient = cardGradients[i % cardGradients.length];
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="snap-start flex-shrink-0 w-[280px] bg-bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-border-accent hover:bg-bg-card-hover transition-all duration-200 hover:-translate-y-1 group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/project/${project.id}`);
                      }
                    }}
                    aria-label={`查看项目 ${project.name}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-full h-36 relative" style={{ background: gradient }}>
                      {project.thumbnail && (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                    {/* Body */}
                    <div className="p-4">
                      <h3 className="font-heading text-base text-text-primary mb-1 group-hover:text-accent transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tag Cloud */}
        {allTags.length > 0 && (
          <section className="px-4 pb-16">
            <h2 className="font-heading text-xl text-text-primary mb-6 text-center">标签</h2>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {allTags.map((tag) => {
                const { color, border, bg } = hashTagColor(tag);
                return (
                  <Link
                    key={tag}
                    to={`/?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{ color, borderColor: border, backgroundColor: bg }}
                  >
                    {tag}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Back to Home */}
        <div className="px-4 pb-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-base rounded-xl text-sm font-medium hover:bg-accent-dim transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
