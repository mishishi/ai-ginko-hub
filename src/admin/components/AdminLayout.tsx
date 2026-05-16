import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { username, logout, token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <span className="font-heading text-lg text-text-primary">
            Ginko <span className="text-accent">Admin</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/projects">Projects</NavLink>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{username}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Logout
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

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
