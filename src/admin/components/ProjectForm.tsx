import { useState } from 'react';
import type { FormEvent } from 'react';

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
    try {
      const token = localStorage.getItem('admin_token')!;
      // Get presigned URL
      const presignedRes = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        }
      );
      const { presignedUrl, publicUrl } = await presignedRes.json();

      // Upload to R2
      await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      set('thumbnail', publicUrl);
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
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
      <Field label="Project Name">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent"
          required
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent resize-none"
          required
        />
      </Field>

      {/* URL */}
      <Field label="Project URL">
        <input
          type="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent"
          placeholder="https://"
          required
        />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap gap-2 mb-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-bg-elevated text-text-secondary text-xs rounded-full"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-accent">
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent flex-1"
            placeholder="Add tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 border border-border rounded-lg text-text-secondary text-sm hover:border-border-hover transition-colors"
          >
            Add
          </button>
        </div>
      </Field>

      {/* Thumbnail */}
      <Field label="Cover Image">
        {form.thumbnail && (
          <img src={form.thumbnail} alt="Cover" className="w-32 h-20 object-cover rounded-lg mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
          className="text-sm text-text-secondary"
          disabled={uploading}
        />
        {uploading && <span className="text-xs text-text-muted ml-2">Uploading...</span>}
      </Field>

      {/* Featured */}
      <Field label="">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-text-secondary">Featured project</span>
        </label>
      </Field>

      {/* SEO */}
      <div className="border-t border-border pt-6">
        <p className="text-sm font-medium text-text-primary mb-4">SEO</p>
        <Field label="OG Title">
          <input
            type="text"
            value={form.ogTitle}
            onChange={(e) => set('ogTitle', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent"
          />
        </Field>
        <Field label="OG Description">
          <textarea
            value={form.ogDescription}
            onChange={(e) => set('ogDescription', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent resize-none"
          />
        </Field>
        <Field label="OG Image URL">
          <input
            type="url"
            value={form.ogImage}
            onChange={(e) => set('ogImage', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent"
            placeholder="https://..."
          />
        </Field>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Project'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
