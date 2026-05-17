import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { API_BASE } from '../../lib/api';

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isLoading: boolean;
}

export interface ProjectFormData {
  name: string;
  description: string;
  tags: string[];
  url: string;
  repoUrl: string;
  thumbnail: string;
  featured: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

const EMPTY: ProjectFormData = {
  name: '',
  description: '',
  tags: [],
  url: '',
  repoUrl: '',
  thumbnail: '',
  featured: false,
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
};

export default function ProjectForm({ initialData, onSubmit, isLoading }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    ...EMPTY,
    ...initialData,
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null); // R2 key for cleanup

  const set = (key: keyof ProjectFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter((t) => t !== tag));
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    let newKey: string | null = null;
    try {
      const presignedRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!presignedRes.ok) throw new Error('presign failed');
      const { presignedUrl, publicUrl, key } = await presignedRes.json();
      newKey = key;

      await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
        signal: AbortSignal.timeout(30000),
      });

      // Delete previous thumbnail from R2 if replacing
      if (thumbnailKey) {
        fetch(`${API_BASE}/api/upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ key: thumbnailKey }),
        }).catch(() => {}); // fire-and-forget cleanup
      }

      setThumbnailKey(newKey);
      set('thumbnail', publicUrl);
    } catch (err) {
      toast.error('封面上传失败，请重试');
      // Clean up the R2 object if upload partially succeeded
      if (newKey) {
        fetch(`${API_BASE}/api/upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ key: newKey }),
        }).catch(() => {});
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <Field label="项目名称">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
          placeholder="项目名称"
          required
        />
      </Field>

      {/* Description */}
      <Field label="描述">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20 resize-none"
          placeholder="简短描述您的项目"
          required
        />
      </Field>

      {/* URL */}
      <Field label="项目链接">
        <input
          type="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
          placeholder="https://github.com/username/project"
          required
          pattern="https?://.+"
          title="请输入有效的 URL（以 http:// 或 https:// 开头）"
        />
      </Field>

      {/* Repo URL */}
      <Field label="源码链接">
        <input
          type="url"
          value={form.repoUrl}
          onChange={(e) => set('repoUrl', e.target.value)}
          className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
          placeholder="https://github.com/username/repo"
          pattern="https?://.+"
          title="请输入有效的 URL（以 http:// 或 https:// 开头）"
        />
      </Field>

      {/* Tags */}
      <Field label="标签">
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] text-[#F8FAFC] text-sm font-fira-sans rounded-lg"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="w-4 h-4 flex items-center justify-center text-[#94A3B8] hover:text-red-400 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
            placeholder="输入标签后按回车添加"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-3 bg-[#1E293B] border border-[#1E293B] text-[#94A3B8] font-fira-sans text-sm rounded-xl hover:border-[#22C55E]/50 hover:text-[#F8FAFC] transition-all duration-200 cursor-pointer"
          >
            添加
          </button>
        </div>
      </Field>

      {/* Thumbnail */}
      <Field label="封面图">
        {form.thumbnail && (
          <div className="mb-3 flex items-center gap-3">
            <img src={form.thumbnail} alt="封面预览" className="w-40 h-25 object-cover rounded-xl border border-[#1E293B]" />
            <button
              type="button"
              onClick={async () => {
                if (thumbnailKey) {
                  await fetch(`${API_BASE}/api/upload`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ key: thumbnailKey }),
                  });
                }
                setThumbnailKey(null);
                set('thumbnail', '');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] font-fira-sans text-sm rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all duration-200 cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              删除
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] font-fira-sans text-sm rounded-xl hover:border-[#22C55E]/50 hover:text-[#F8FAFC] transition-all duration-200 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {uploading ? '上传中...' : '选择图片'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploading && (
            <span className="flex items-center gap-2 text-[#64748B] font-fira-sans text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              上传中...
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-[#64748B] font-fira-sans">推荐使用 WebP 格式，可获得更好的压缩率和画质</p>
      </Field>

      {/* Featured */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[#1E293B] peer-focus:ring-2 peer-focus:ring-[#22C55E]/20 rounded-full peer transition-all duration-200 peer-checked:bg-[#22C55E]"></div>
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-[#94A3B8] rounded-full transition-all duration-200 peer-checked:translate-x-5 peer-checked:bg-white"></div>
        </label>
        <span className="font-fira-sans text-sm text-[#F8FAFC]">精选项目</span>
      </div>

      {/* SEO */}
      <div className="border-t border-[#1E293B] pt-6">
        <p className="font-fira-sans font-medium text-[#F8FAFC] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          SEO 设置
        </p>
        <div className="space-y-4">
          <Field label="OG 标题">
            <input
              type="text"
              value={form.ogTitle}
              onChange={(e) => set('ogTitle', e.target.value)}
              className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
              placeholder="社交分享自定义标题"
            />
          </Field>
          <Field label="OG 描述">
            <textarea
              value={form.ogDescription}
              onChange={(e) => set('ogDescription', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20 resize-none"
              placeholder="社交分享自定义描述"
            />
          </Field>
          <Field label="OG 图片链接">
            <input
              type="url"
              value={form.ogImage}
              onChange={(e) => set('ogImage', e.target.value)}
              className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
              placeholder="https://example.com/og-image.png"
            />
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-fira-sans font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              保存中...
            </span>
          ) : '保存项目'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] font-fira-sans text-sm rounded-xl hover:border-[#475569] hover:text-[#F8FAFC] transition-all duration-200 cursor-pointer"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block font-fira-sans text-sm text-[#94A3B8] mb-2">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}