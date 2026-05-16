import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../../lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  featured: boolean;
  viewCount: number;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此项目？')) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        toast.success('项目已删除');
      } else {
        toast.error('删除失败，请重试');
      }
    } catch {
      toast.error('删除失败，请检查网络连接');
    } finally {
      setDeleting(null);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-fira-code text-2xl text-[#F8FAFC] mb-1">项目管理</h1>
          <p className="font-fira-sans text-sm text-[#64748B]">共 {projects.length} 个项目</p>
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

      {/* Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#334155] mb-4">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <p className="font-fira-sans text-[#64748B] mb-4">暂无项目</p>
            <Link
              to="/admin/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-fira-sans text-sm rounded-xl hover:bg-[#22C55E]/20 transition-all duration-200 cursor-pointer"
            >
              创建您的第一个项目
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th className="px-5 py-4 text-left font-fira-sans font-medium text-[#64748B] text-xs uppercase tracking-wider">项目</th>
                <th className="px-5 py-4 text-left font-fira-sans font-medium text-[#64748B] text-xs uppercase tracking-wider">标签</th>
                <th className="px-5 py-4 text-left font-fira-sans font-medium text-[#64748B] text-xs uppercase tracking-wider">精选</th>
                <th className="px-5 py-4 text-left font-fira-sans font-medium text-[#64748B] text-xs uppercase tracking-wider">浏览</th>
                <th className="px-5 py-4 text-right font-fira-sans font-medium text-[#64748B] text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className="border-b border-[#1E293B]/50 last:border-0 hover:bg-[#1E293B]/20 transition-colors duration-150"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-5 py-4">
                    <span className="font-fira-sans font-medium text-[#F8FAFC]">{project.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[#1E293B] text-[#94A3B8] text-xs font-fira-sans rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[#475569] text-xs font-fira-sans">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {project.featured ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-fira-sans rounded-md">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        是
                      </span>
                    ) : (
                      <span className="text-[#475569] text-xs font-fira-sans">否</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-fira-code text-[#94A3B8]">{project.viewCount.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        to={`/admin/projects/${project.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-[#94A3B8] hover:text-[#22C55E] font-fira-sans text-sm transition-colors duration-200 cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        className="inline-flex items-center gap-1.5 text-[#94A3B8] hover:text-red-400 font-fira-sans text-sm transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                      >
                        {deleting === project.id ? (
                          <>
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            删除中...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            删除
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
