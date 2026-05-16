interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: Props) {
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

        <div className="relative flex-1 max-w-48 sm:max-w-80">
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
