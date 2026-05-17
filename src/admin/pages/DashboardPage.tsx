import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { API_BASE } from '../../lib/api';

interface Stats {
  total: number;
  featured: number;
  techCount: number;
  totalViews: number;
}

interface AnalyticsSummary {
  pv: number;
  uv: number;
  topProjects: { projectId: string; projectName: string; count: number }[];
  topTags: { tag: string; count: number }[];
  topSearches: { query: string; count: number }[];
  dailyPV: { date: string; count: number }[];
  topExternalLinks: { projectId: string; projectName: string; linkType: string; count: number }[];
  topFailedSearches: { query: string; count: number }[];
  favoriteStats: { adds: number; removes: number; net: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API_BASE}/api/analytics/summary`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setAnalytics(data))
      .catch(() => {});
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

      {/* Analytics Summary */}
      <div className="mt-8">
        <h2 className="font-fira-code text-sm text-[#64748B] uppercase tracking-wider mb-4">访客分析 (近30天)</h2>

        {/* PV & UV Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <StatCard
            label="页面浏览"
            value={analytics?.pv ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            }
            color="#3B82F6"
          />
          <StatCard
            label="独立访客"
            value={analytics?.uv ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
            color="#8B5CF6"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Daily PV Area Chart */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 lg:col-span-2">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-4">每日浏览量 (近14天)</h3>
            {analytics?.dailyPV && analytics.dailyPV.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={analytics.dailyPV} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c97d5c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c97d5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Fira Code' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Fira Code' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#c97d5c' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#c97d5c"
                    strokeWidth={2}
                    fill="url(#pvGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#c97d5c' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>

          {/* Top Projects Bar Chart */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-3">热门项目 Top 5</h3>
            {analytics?.topProjects && analytics.topProjects.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.topProjects.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="projectName"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Fira Sans' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#c97d5c' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.topProjects.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill="#c97d5c" fillOpacity={1 - i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Tags Bar Chart */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-3">热门标签 Top 5</h3>
            {analytics?.topTags && analytics.topTags.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.topTags.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Fira Sans' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#7d9a8e' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.topTags.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill="#7d9a8e" fillOpacity={1 - i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>

          {/* Top Searches Bar Chart */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-3">热门搜索 Top 5</h3>
            {analytics?.topSearches && analytics.topSearches.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.topSearches.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="query"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Fira Sans' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#3B82F6' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.topSearches.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill="#3B82F6" fillOpacity={1 - i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>
        </div>

        {/* Favorite Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="收藏次数"
            value={analytics?.favoriteStats?.adds ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            }
            color="#F59E0B"
          />
          <StatCard
            label="取消收藏"
            value={analytics?.favoriteStats?.removes ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2"/>
              </svg>
            }
            color="#EF4444"
          />
          <StatCard
            label="净收藏量"
            value={analytics?.favoriteStats?.net ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            }
            color="#22C55E"
          />
        </div>

        {/* External Links & Failed Searches Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top External Link Clicks */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-3">外链点击 Top 5</h3>
            {analytics?.topExternalLinks && analytics.topExternalLinks.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.topExternalLinks.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="projectName"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Fira Sans' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    formatter={(value: number, name: string, props: { payload?: { linkType?: string } }) => [
                      value,
                      props.payload?.linkType === 'repo_url' ? '源码链接' : '项目链接',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.topExternalLinks.slice(0, 5).map((r, i) => (
                      <Cell key={i} fill={r.linkType === 'repo_url' ? '#8B5CF6' : '#c97d5c'} fillOpacity={1 - i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>

          {/* Top Failed Searches */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="font-fira-sans text-sm text-[#94A3B8] mb-3">无结果搜索 Top 5</h3>
            {analytics?.topFailedSearches && analytics.topFailedSearches.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={analytics.topFailedSearches.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="query"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Fira Sans' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: 'Fira Sans',
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#EF4444' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.topFailedSearches.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill="#EF4444" fillOpacity={1 - i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#64748B] h-[180px] flex items-center justify-center">暂无数据</p>
            )}
          </div>
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
