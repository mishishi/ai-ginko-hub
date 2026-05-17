import type { Project } from '../types';
import { API_BASE } from '../lib/api';

export async function fetchProjects(
  tag?: string,
  q?: string,
  limit?: number,
  offset?: number,
  signal?: AbortSignal,
  sort?: string,
  featured?: boolean
): Promise<{ projects: Project[]; total: number }> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined) params.set('offset', String(offset));
  if (sort) params.set('sort', sort);
  if (featured) params.set('featured', 'true');
  const url = `${API_BASE}/api/projects${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error ?? `Failed to fetch projects (${res.status})`);
  }
  const total = Number(res.headers.get('X-Total-Count') || 0);
  return { projects: await res.json(), total };
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error ?? `Project not found (${res.status})`);
  }
  return res.json();
}
