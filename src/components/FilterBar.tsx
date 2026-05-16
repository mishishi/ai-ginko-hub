interface Props {
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function FilterBar({ tags, activeTag, onTagChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 pb-4 sm:pb-6" role="group" aria-label="标签筛选">
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
