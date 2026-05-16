export type SortOption = 'default' | 'name' | 'date' | 'views' | 'featured';

interface Props {
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  default: '默认排序',
  name: '按名称',
  date: '最新发布',
  views: '最多浏览',
  featured: '精选优先',
};

export default function FilterBar({ tags, activeTag, onTagChange, sort, onSortChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 pb-4 sm:pb-6" role="group" aria-label="标签筛选">
      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] pr-8 rounded-full border border-border text-[11px] sm:text-xs font-medium cursor-pointer whitespace-nowrap bg-transparent text-text-secondary hover:border-border-hover hover:text-text-primary transition-[color,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          aria-label="排序方式"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <button
        type="button"
        className={`px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] flex items-center rounded-full border text-[11px] sm:text-xs font-medium cursor-pointer whitespace-nowrap transition-[color,border-color,background] duration-200 ease-out ${
          activeTag === null
            ? 'border-accent-dim text-accent bg-accent-glow'
            : 'border-border text-text-secondary bg-transparent hover:border-border-hover hover:text-text-primary hover:bg-bg-elevated'
        }`}
        onClick={() => onTagChange(null)}
        aria-pressed={activeTag === null}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] flex items-center rounded-full border text-[11px] sm:text-xs font-medium cursor-pointer whitespace-nowrap transition-[color,border-color,background] duration-200 ease-out ${
            activeTag === tag
              ? 'border-accent-dim text-accent bg-accent-glow'
              : 'border-border text-text-secondary bg-transparent hover:border-border-hover hover:text-text-primary hover:bg-bg-elevated'
          }`}
          onClick={() => onTagChange(tag === activeTag ? null : tag)}
          aria-pressed={activeTag === tag}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
