import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Footer() {
  const githubUsername = import.meta.env.VITE_GITHUB_USERNAME;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('敬请期待');
  };

  return (
    <footer className="border-t border-border py-10 mt-auto">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
          {/* Brand — existing */}
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

          {/* Navigation — existing */}
          <nav aria-label="页脚导航" className="grid grid-cols-2 gap-x-8 gap-y-2">
            <Link to="/" className="text-xs text-text-muted hover:text-accent transition-colors duration-200">项目</Link>
            <Link to="/about" className="text-xs text-text-muted hover:text-accent transition-colors duration-200">关于</Link>
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted hover:text-accent transition-colors duration-200"
            >
              GitHub
            </a>
          </nav>

          {/* Newsletter — new */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted uppercase tracking-widest">订阅更新</span>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                required
                className="px-3 py-1.5 text-xs bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-36"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-accent text-bg-base rounded-lg hover:bg-accent-dim transition-colors cursor-pointer"
              >
                订阅
              </button>
            </form>
          </div>
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
  );
}
