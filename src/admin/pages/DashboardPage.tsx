import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../lib/api';

interface Stats {
  total: number;
  featured: number;
  techCount: number;
  totalViews: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span className="font-fira-sans text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-fira-code text-2xl text-[#F8FAFC] mb-1">控制台</h1>
          <p className="font-fira-sans text-sm text-[#64748B]">项目概览</p>
        </div>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-fira-sans font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新建项目
        </Link>
      </div>

      {/* Stats Grid - Bento style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="项目总数"
          value={stats?.total ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          }
          color="#22C55E"
        />
        <StatCard
          label="精选项目"
          value={stats?.featured ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
          color="#F59E0B"
        />
        <StatCard
          label="技术栈"
          value={stats?.techCount ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          }
          color="#8B5CF6"
        />
        <StatCard
          label="总浏览量"
          value={stats?.totalViews ?? 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          }
          color="#3B82F6"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-fira-code text-sm text-[#64748B] uppercase tracking-wider mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] hover:border-[#22C55E]/50 text-[#F8FAFC] font-fira-sans text-sm rounded-xl transition-all duration-200 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加项目
          </Link>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] hover:border-[#22C55E]/50 text-[#F8FAFC] font-fira-sans text-sm rounded-xl transition-all duration-200 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            查看全部项目
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 hover:border-[#1E293B]/80 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="font-fira-code text-3xl text-[#F8FAFC] mb-1">{value.toLocaleString()}</p>
      <p className="font-fira-sans text-sm text-[#64748B]">{label}</p>
    </div>
  );
}
