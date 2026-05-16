import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    const token = localStorage.getItem('admin_token');
    fetch(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setDeleting(id);
    const token = localStorage.getItem('admin_token')!;
    await fetch(
      `${API_BASE}/api/projects/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-text-primary">Projects</h1>
        <Link
          to="/admin/projects/new"
          className="px-4 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors text-sm"
        >
          + New Project
        </Link>
      </div>

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-text-muted font-medium">Name</th>
              <th className="px-4 py-3 text-text-muted font-medium">Tags</th>
              <th className="px-4 py-3 text-text-muted font-medium">Featured</th>
              <th className="px-4 py-3 text-text-muted font-medium">Views</th>
              <th className="px-4 py-3 text-text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="text-text-primary font-medium">{project.name}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-elevated text-text-muted text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {project.featured ? (
                    <span className="text-accent text-xs">Yes</span>
                  ) : (
                    <span className="text-text-muted text-xs">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">{project.viewCount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/admin/projects/${project.id}/edit`}
                      className="text-text-secondary hover:text-accent transition-colors text-xs"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                      className="text-text-secondary hover:text-red-400 transition-colors text-xs disabled:opacity-50"
                    >
                      {deleting === project.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
