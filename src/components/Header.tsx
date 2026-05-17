import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignInButton, UserButton, useAuth } from '@clerk/react';
import { useTheme } from '../hooks/useTheme';

interface Props {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Header({ searchQuery = '', onSearchChange }: Props) {
  const { isSignedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external searchQuery prop (for URL sync)
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Pagefind search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);

    // pagefind 索引只在生产构建后存在，dev 时静默忽略
    const pfUrl = '/pagefind/pagefind.js';
    import(/* @vite-ignore */ pfUrl)
      .then(async (pf: any) => {
        if (cancelled) return;
        const search = await pf.search(query);
        const data = await Promise.all(search.results.slice(0, 5).map((r: any) => r.data()));
        if (!cancelled) {
          setResults(data);
          setSearching(false);
          setShowResults(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (url: string) => {
    navigate(url);
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (onSearchChange) onSearchChange('');
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-base/85 backdrop-blur-[16px] saturate-[1.2] border-b border-border">
      <div className="mx-auto flex items-center justify-between h-14 sm:h-[72px] gap-4 sm:gap-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2.5 no-underline" aria-label="Ginko Hub 首页">
            <span className="flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="#c97d5c" opacity="0.15" />
                <path d="M16 6C12 6 8 10 8 14c0 4 2 6 4 8l4 4 4-4c2-2 4-4 4-8 0-4-4-8-8-8z" fill="#c97d5c" opacity="0.9" />
                <path d="M16 10c-2 0-4 2-4 4s1.5 3 2.5 4L16 20l1.5-2c1-1 2.5-2 2.5-4s-2-4-4-4z" fill="#ece8e3" opacity="0.85" />
              </svg>
            </span>
            <span className="font-heading text-lg tracking-tight text-text-primary">
              Ginko <span className="text-accent">Hub</span>
            </span>
          </a>
          <p className="hidden sm:block text-xs text-text-muted leading-none mt-0.5">AI 项目展示</p>
        </div>

        <nav aria-label="主导航" className="hidden sm:flex items-center gap-1">
          <Link to="/" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-md transition-colors duration-200">项目</Link>
          <Link to="/about" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-md transition-colors duration-200">关于</Link>
          {isSignedIn && (
            <>
              <Link to="/favorites" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-md transition-colors duration-200">收藏</Link>
              <Link to="/profile" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-md transition-colors duration-200">个人中心</Link>
            </>
          )}
        </nav>

        {onSearchChange && (
          <div className="relative flex-1 max-w-48 sm:max-w-xl" ref={containerRef}>
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label htmlFor="header-search" className="sr-only">搜索项目</label>
            <input
              id="header-search"
              type="search"
              inputMode="search"
              className="w-full h-9 sm:h-11 pl-9 sm:pl-[36px] pr-3 border border-border rounded-[8px] bg-bg-elevated text-text-primary font-body text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-text-muted focus:border-accent-dim focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
              placeholder="搜索..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              onFocus={() => results.length > 0 && setShowResults(true)}
            />
            {showResults && (results.length > 0 || searching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-[8px] shadow-lg overflow-hidden z-50">
                {searching ? (
                  <div className="px-4 py-3 text-sm text-text-muted">搜索中...</div>
                ) : (
                  <ul className="divide-y divide-border" role="listbox">
                    {results.map((r, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-bg-card-hover transition-colors duration-150"
                          onClick={() => handleResultClick(r.url)}
                          role="option"
                          aria-selected="false"
                        >
                          <div className="text-sm font-medium text-text-primary truncate">{r.meta?.title || '无标题'}</div>
                          {r.excerpt && (
                            <div
                              className="text-xs text-text-secondary mt-0.5 line-clamp-2 [&_mark]:bg-accent/30 [&_mark]:text-accent [&_mark]:rounded-sm"
                              dangerouslySetInnerHTML={{ __html: r.excerpt }}
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button className="flex items-center justify-center w-11 h-11 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200">
              登录
            </button>
          </SignInButton>
        )}

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-11 h-11 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200"
          aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
