import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectForm, { type ProjectFormData } from '../components/ProjectForm';
import { API_BASE } from '../../lib/api';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [initialData, setInitialData] = useState<Partial<ProjectFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    const token = localStorage.getItem('admin_token')!;
    fetch(
      `${API_BASE}/api/projects/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        setInitialData(data);
        setIsLoading(false);
      });
  }, [id, isEditing]);

  const handleSubmit = async (data: ProjectFormData) => {
    const token = localStorage.getItem('admin_token')!;
    const url = isEditing
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`
      : `${API_BASE}/api/projects`;

    await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    navigate('/admin/projects');
  };

  if (isLoading) {
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
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/admin/projects')}
            className="p-1.5 -ml-1.5 text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="font-fira-code text-2xl text-[#F8FAFC]">
            {isEditing ? '编辑项目' : '新建项目'}
          </h1>
        </div>
        <p className="font-fira-sans text-sm text-[#64748B] ml-9">
          {isEditing ? '更新项目详情和设置' : '添加新项目到作品集'}
        </p>
      </div>

      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 lg:p-8">
        <ProjectForm initialData={initialData || undefined} onSubmit={handleSubmit} isLoading={false} />
      </div>
    </div>
  );
}