import type { Project } from '../types';

export const projects: Project[] = [
  {
    id: 'ai-chat',
    name: 'AI Chat Interface',
    description: '智能对话助手，支持多轮对话与上下文理解。基于大语言模型构建的自然语言交互界面。',
    tags: ['React', 'TypeScript', 'AI', 'LLM'],
    url: 'https://chat.example.com',
    createdAt: '2025-12',
    featured: true,
  },
  {
    id: 'image-workshop',
    name: 'Image Workshop',
    description: 'AI 图像生成与编辑工具，支持文生图、图生图、风格迁移等多种创作模式。',
    tags: ['Next.js', 'Python', 'Stable Diffusion', 'AI'],
    url: 'https://image.example.com',
    createdAt: '2026-01',
    featured: true,
  },
  {
    id: 'data-viz',
    name: 'DataViz Dashboard',
    description: '实时数据分析看板，接入 AI 分析引擎，自动生成数据洞察报告和可视化图表。',
    tags: ['React', 'D3.js', 'Node.js', 'Dashboard'],
    url: 'https://dataviz.example.com',
    createdAt: '2026-02',
    featured: true,
  },
  {
    id: 'mind-flow',
    name: 'MindFlow',
    description: 'AI 辅助思维导图工具，将自然语言描述自动转化为结构化思维导图。',
    tags: ['Vue 3', 'AI', 'NLP', 'Productivity'],
    url: 'https://mindflow.example.com',
    createdAt: '2026-02',
  },
  {
    id: 'code-assist',
    name: 'CodeAssist Pro',
    description: 'AI 代码助手，提供智能补全、代码审查、重构建议和文档生成。',
    tags: ['TypeScript', 'VS Code', 'AI', 'Developer Tools'],
    url: 'https://codeassist.example.com',
    createdAt: '2026-03',
    featured: true,
  },
  {
    id: 'write-hub',
    name: 'WriteHub',
    description: 'AI 写作平台，支持长文创作、文案生成、多语言翻译和风格改写。',
    tags: ['Next.js', 'AI', 'Writing', 'SaaS'],
    url: 'https://writehub.example.com',
    createdAt: '2026-03',
  },
  {
    id: 'voice-note',
    name: 'VoiceNote',
    description: '语音转文字笔记工具，支持实时转录、说话人识别和 AI 摘要生成。',
    tags: ['React', 'WebRTC', 'AI', 'Audio'],
    url: 'https://voicenote.example.com',
    createdAt: '2026-03',
  },
  {
    id: 'learn-path',
    name: 'LearnPath',
    description: 'AI 个性化学习路径规划器，根据学习目标和进度动态调整课程推荐。',
    tags: ['Vue 3', 'AI', 'Education', 'Recommendation'],
    url: 'https://learnpath.example.com',
    createdAt: '2026-04',
  },
  {
    id: 'form-builder',
    name: 'FormCraft',
    description: 'AI 智能表单构建器，通过自然语言描述即可生成复杂表单和验证逻辑。',
    tags: ['React', 'TypeScript', 'AI', 'Low-Code'],
    url: 'https://formcraft.example.com',
    createdAt: '2026-04',
  },
  {
    id: 'media-studio',
    name: 'Media Studio',
    description: 'AI 多媒体处理工具，集成视频剪辑、字幕生成、封面设计和内容分析。',
    tags: ['Next.js', 'FFmpeg', 'AI', 'Media'],
    url: 'https://media.example.com',
    createdAt: '2026-05',
  },
];

export const allTags = Array.from(
  new Set(projects.flatMap((p) => p.tags))
).sort();

export async function fetchProjects(tag?: string, q?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`
  );
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}
