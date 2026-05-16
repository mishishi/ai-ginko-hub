import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!username) {
      navigate('/admin/login', { replace: true });
    }
  }, [username, navigate]);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#020617]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#0F172A] border-r border-[#1E293B] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[#1E293B]">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center group-hover:bg-[#22C55E]/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#22C55E]">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.8"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            <span className="font-fira-code text-base text-[#F8FAFC]">
              Ginko <span className="text-[#22C55E]">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/admin"
            className={`flex items-center px-3 py-2.5 text-sm font-fira-sans rounded-xl transition-all duration-200 cursor-pointer ${
              location.pathname === '/admin'
                ? 'bg-[#1E293B] text-[#F8FAFC]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            Dashboard
          </Link>
          <Link
            to="/admin/projects"
            className={`flex items-center px-3 py-2.5 text-sm font-fira-sans rounded-xl transition-all duration-200 cursor-pointer ${
              isActive('/admin/projects')
                ? 'bg-[#1E293B] text-[#F8FAFC]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Projects
          </Link>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#1E293B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center">
                <span className="font-fira-code text-xs text-[#94A3B8]">{username?.[0]?.toUpperCase()}</span>
              </div>
              <span className="font-fira-sans text-sm text-[#94A3B8] truncate max-w-[100px]">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer"
              title="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}