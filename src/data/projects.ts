import type { Project } from '../types';
import { API_BASE } from '../lib/api';

export async function fetchProjects(tag?: string, q?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  const url = `${API_BASE}/api/projects${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}
