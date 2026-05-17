import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { API_BASE } from '../../lib/api';

interface Project {
  id: string;
  name: string;
  tags: string;
}

const parseTags = (tagsJson: string): string[] => {
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
};

const serializeTags = (tags: string[]): string => JSON.stringify(tags);

export default function TagManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTag, setEditingTag] = useState<{ projectId: string; tagIndex: number; value: string } | null>(null);
  const [addingTagTo, setAddingTagTo] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects?limit=100`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateProjectTags = async (projectId: string, tags: string[]) => {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: serializeTags(tags),
    });
    if (!res.ok) {
      throw new Error('更新失败');
    }
  };

  const handleRemoveTag = async (projectId: string, tagIndex: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const tags = parseTags(project.tags);
    tags.splice(tagIndex, 1);
    try {
      await updateProjectTags(projectId, tags);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tags: serializeTags(tags) } : p
        )
      );
      toast.success('标签已移除');
    } catch {
      toast.error('移除标签失败');
    }
  };

  const handleRenameTag = async (projectId: string, tagIndex: number, newName: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const tags = parseTags(project.tags);
    tags[tagIndex] = newName.trim();
    try {
      await updateProjectTags(projectId, tags);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tags: serializeTags(tags) } : p
        )
      );
      setEditingTag(null);
      toast.success('标签已重命名');
    } catch {
      toast.error('重命名标签失败');
    }
  };

  const handleAddTag = async (projectId: string) => {
    const tagName = newTagInput.trim();
    if (!tagName) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const tags = parseTags(project.tags);
    tags.push(tagName);
    try {
      await updateProjectTags(projectId, tags);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tags: serializeTags(tags) } : p
        )
      );
      setNewTagInput('');
      setAddingTagTo(null);
      toast.success('标签已添加');
    } catch {
      toast.error('添加标签失败');
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 admin-body">
        <div className="flex items-center gap-3 text-[var(--admin-text-muted)]">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="font-fira-sans text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl admin-body">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-fira-code text-2xl text-[var(--admin-text)] mb-1">标签管理</h1>
        <p className="font-fira-sans text-sm text-[var(--admin-text-dim)]">编辑项目标签</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--admin-text-dim)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text)] placeholder-[var(--admin-text-dim)] font-fira-sans text-sm focus:outline-none focus:border-[var(--admin-accent)] transition-colors"
          />
        </div>
      </div>

      {/* Project List */}
      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#334155] mb-4"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <p className="font-fira-sans text-[var(--admin-text-dim)]">
              {search ? '未找到匹配的项目' : '暂无项目'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-border)]/50">
            {filteredProjects.map((project) => {
              const tags = parseTags(project.tags);
              return (
                <div
                  key={project.id}
                  className="px-5 py-4 hover:bg-[var(--admin-border)]/20 transition-colors duration-150"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-fira-sans font-medium text-[var(--admin-text)] min-w-[160px] pt-1">
                      {project.name}
                    </span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {tags.map((tag, index) => (
                        <div key={`${tag}-${index}`} className="group relative">
                          {editingTag?.projectId === project.id &&
                          editingTag?.tagIndex === index ? (
                            <input
                              autoFocus
                              className="px-2 py-1 bg-[var(--admin-border)] border border-[var(--admin-accent)] rounded-md text-[var(--admin-text)] font-fira-sans text-sm w-28 focus:outline-none"
                              defaultValue={tag}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameTag(
                                    project.id,
                                    index,
                                    (e.target as HTMLInputElement).value
                                  );
                                } else if (e.key === 'Escape') {
                                  setEditingTag(null);
                                }
                              }}
                              onBlur={(e) => {
                                handleRenameTag(project.id, index, e.target.value);
                              }}
                            />
                          ) : (
                            <button
                              onClick={() =>
                                setEditingTag({ projectId: project.id, tagIndex: index, value: tag })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--admin-border)] hover:bg-[var(--admin-border-hover)] text-[var(--admin-text)] font-fira-sans text-sm rounded-md transition-colors"
                            >
                              {tag}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTag(project.id, index);
                                }}
                                className="opacity-0 group-hover:opacity-100 ml-1 text-[var(--admin-text-muted)] hover:text-red-400 transition-opacity"
                                aria-label={`Remove ${tag}`}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add Tag */}
                      {addingTagTo === project.id ? (
                        <input
                          autoFocus
                          className="px-2 py-1 bg-[var(--admin-border)] border border-[var(--admin-accent)] rounded-md text-[var(--admin-text)] font-fira-sans text-sm w-28 focus:outline-none"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTag(project.id);
                            } else if (e.key === 'Escape') {
                              setAddingTagTo(null);
                              setNewTagInput('');
                            }
                          }}
                          onBlur={() => {
                            if (newTagInput.trim()) {
                              handleAddTag(project.id);
                            } else {
                              setAddingTagTo(null);
                              setNewTagInput('');
                            }
                          }}
                          placeholder="新标签"
                        />
                      ) : (
                        <button
                          onClick={() => setAddingTagTo(project.id)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-[var(--admin-border)] hover:bg-[var(--admin-accent)]/20 border border-dashed border-[#334155] hover:border-[var(--admin-accent)] text-[var(--admin-text-dim)] hover:text-[var(--admin-accent)] rounded-md transition-colors"
                          aria-label="Add tag"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
