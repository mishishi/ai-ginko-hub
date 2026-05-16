const API_BASE = 'http://localhost:4001';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const projects = [
  {
    id: 'ai-chat',
    name: 'AI Chat Interface',
    description: '智能对话助手，支持多轮对话与上下文理解。基于大语言模型构建的自然语言交互界面。',
    tags: ['React', 'TypeScript', 'AI', 'LLM'],
    thumbnail: '/thumbnails/ai-chat.svg',
    url: 'https://chat.example.com',
    createdAt: '2025-12',
    featured: true,
  },
  {
    id: 'image-workshop',
    name: 'Image Workshop',
    description: 'AI 图像生成与编辑工具，支持文生图、图生图、风格迁移等多种创作模式。',
    tags: ['Next.js', 'Python', 'Stable Diffusion', 'AI'],
    thumbnail: '/thumbnails/image-workshop.svg',
    url: 'https://image.example.com',
    createdAt: '2026-01',
    featured: true,
  },
  {
    id: 'data-viz',
    name: 'DataViz Dashboard',
    description: '实时数据分析看板，接入 AI 分析引擎，自动生成数据洞察报告和可视化图表。',
    tags: ['React', 'D3.js', 'Node.js', 'Dashboard'],
    thumbnail: '/thumbnails/data-viz.svg',
    url: 'https://dataviz.example.com',
    createdAt: '2026-02',
    featured: true,
  },
  {
    id: 'mind-flow',
    name: 'MindFlow',
    description: 'AI 辅助思维导图工具，将自然语言描述自动转化为结构化思维导图。',
    tags: ['Vue 3', 'AI', 'NLP', 'Productivity'],
    thumbnail: '/thumbnails/mind-flow.svg',
    url: 'https://mindflow.example.com',
    createdAt: '2026-02',
  },
  {
    id: 'code-assist',
    name: 'CodeAssist Pro',
    description: 'AI 代码助手，提供智能补全、代码审查、重构建议和文档生成。',
    tags: ['TypeScript', 'VS Code', 'AI', 'Developer Tools'],
    thumbnail: '/thumbnails/code-assist.svg',
    url: 'https://codeassist.example.com',
    createdAt: '2026-03',
    featured: true,
  },
  {
    id: 'write-hub',
    name: 'WriteHub',
    description: 'AI 写作平台，支持长文创作、文案生成、多语言翻译和风格改写。',
    tags: ['Next.js', 'AI', 'Writing', 'SaaS'],
    thumbnail: '/thumbnails/write-hub.svg',
    url: 'https://writehub.example.com',
    createdAt: '2026-03',
  },
  {
    id: 'voice-note',
    name: 'VoiceNote',
    description: '语音转文字笔记工具，支持实时转录、说话人识别和 AI 摘要生成。',
    tags: ['React', 'WebRTC', 'AI', 'Audio'],
    thumbnail: '/thumbnails/voice-note.svg',
    url: 'https://voicenote.example.com',
    createdAt: '2026-03',
  },
  {
    id: 'learn-path',
    name: 'LearnPath',
    description: 'AI 个性化学习路径规划器，根据学习目标和进度动态调整课程推荐。',
    tags: ['Vue 3', 'AI', 'Education', 'Recommendation'],
    thumbnail: '/thumbnails/learn-path.svg',
    url: 'https://learnpath.example.com',
    createdAt: '2026-04',
  },
  {
    id: 'form-builder',
    name: 'FormCraft',
    description: 'AI 智能表单构建器，通过自然语言描述即可生成复杂表单和验证逻辑。',
    tags: ['React', 'TypeScript', 'AI', 'Low-Code'],
    thumbnail: '/thumbnails/form-builder.svg',
    url: 'https://formcraft.example.com',
    createdAt: '2026-04',
  },
  {
    id: 'media-studio',
    name: 'Media Studio',
    description: 'AI 多媒体处理工具，集成视频剪辑、字幕生成、封面设计和内容分析。',
    tags: ['Next.js', 'FFmpeg', 'AI', 'Media'],
    thumbnail: '/thumbnails/media-studio.svg',
    url: 'https://media.example.com',
    createdAt: '2026-05',
  },
];

async function migrate() {
  console.log('🔐 Logging in...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    console.error('❌ Login failed:', err);
    process.exit(1);
  }

  const { token } = await loginRes.json();
  console.log('✅ Logged in');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  for (const project of projects) {
    console.log(`📦 Migrating: ${project.name}`);
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(project),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`   ❌ Failed: ${err}`);
    } else {
      console.log(`   ✅ Done`);
    }
  }

  console.log('\n🎉 Migration complete!');
}

migrate().catch(console.error);
