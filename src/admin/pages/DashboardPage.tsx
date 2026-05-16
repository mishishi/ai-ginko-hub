import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
    const token = localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl text-text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <StatCard label="Total Projects" value={stats?.total ?? 0} />
        <StatCard label="Featured" value={stats?.featured ?? 0} />
        <StatCard label="Tech Stack" value={stats?.techCount ?? 0} />
        <StatCard label="Total Views" value={stats?.totalViews ?? 0} />
      </div>
      <div className="mt-8">
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors text-sm"
        >
          + New Project
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <p className="text-2xl font-heading text-text-primary">{value.toLocaleString()}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
