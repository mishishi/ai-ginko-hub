import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { tagColors } from '../data/tagColors';
import Header from '../components/Header';

interface AboutStats {
  total: number;
  featured: number;
  techCount: number;
  totalViews: number;
}

export default function About() {
  const [stats, setStats] = useState<AboutStats | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/api/tags`).then((r) => r.json()),
    ]).then(([statsData, tagsData]) => {
      setStats(statsData);
      setAllTags(tagsData.tags);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-text-muted">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-sm">加载中...</span>
          </div>
        </main>
      </div>
    );
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

      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          {/* Page title */}
          <h1 className="sr-only">About</h1>

          {/* Avatar + Name + One-liner */}
          <section className="flex flex-col items-center text-center mb-12">
            {/* Avatar placeholder */}
            <div
              className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mb-6"
              aria-hidden="true"
            >
              <span className="font-heading text-3xl text-bg-base font-medium">GK</span>
            </div>

            <h2 className="font-heading text-3xl text-text-primary mb-2">Ginko</h2>
            <p className="text-text-secondary text-base">AI 爱好者 | 独立开发者</p>
          </section>

          {/* Bio */}
          <section className="mb-12 space-y-4">
            <p className="text-text-secondary leading-relaxed">
              我是一名热爱 AI 技术的独立开发者，专注于使用人工智能辅助构建高质量的
              Web 应用。从前端的交互设计到后端的架构实现，我享受将创意转化为产品的完整过程。
            </p>
            <p className="text-text-secondary leading-relaxed">
              我的项目涵盖多个领域，包括智能对话系统、图像生成工具、数据可视化平台等。
              每一个项目都是对新技术边界的探索，也是对用户体验的深度思考。我坚信好的产品
              源于对细节的极致追求。
            </p>
            <p className="text-text-secondary leading-relaxed">
              当我不在写代码时，你可能会在研究最新的 AI 论文、尝试新的开发工具，
              或者在思考如何让现有的工作流更加高效。欢迎与我交流技术心得！
            </p>
          </section>

          {/* Skills */}
          <section className="mb-12">
            <h3 className="font-heading text-xl text-text-primary mb-4">技术栈</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const color = tagColors[tag] ?? '#c97d5c';
                return (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200"
                    style={{
                      color,
                      borderColor: `${color}40`,
                      backgroundColor: `${color}10`,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Social Links */}
          <section className="mb-12">
            <h3 className="font-heading text-xl text-text-primary mb-4">社交链接</h3>
            <div className="flex flex-wrap gap-6">
              {/* GitHub */}
              <a
                href="https://github.com/mishishi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors duration-200"
                aria-label="GitHub 主页"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm">GitHub</span>
              </a>

              {/* Email */}
              <a
                href="mailto:hello@ginko.example.com"
                className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors duration-200"
                aria-label="发送邮件"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="text-sm">Email</span>
              </a>
            </div>
          </section>

          {/* Stats */}
          <section>
            <h3 className="font-heading text-xl text-text-primary mb-4">数据统计</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
                <div className="font-heading text-3xl text-text-primary mb-1">
                  {stats.total}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-widest">
                  总项目数
                </div>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
                <div className="font-heading text-3xl text-text-primary mb-1">
                  {stats.featured}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-widest">
                  精选项目
                </div>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
                <div className="font-heading text-3xl text-text-primary mb-1">
                  {allTags.length}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-widest">
                  技术栈数
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
