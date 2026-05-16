import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectForm, { type ProjectFormData } from '../components/ProjectForm';

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
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`,
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
      : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects`;

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

  if (isLoading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl text-text-primary mb-6">
        {isEditing ? 'Edit Project' : 'New Project'}
      </h1>
      <ProjectForm initialData={initialData || undefined} onSubmit={handleSubmit} isLoading={false} />
    </div>
  );
}
