import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617]">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#22C55E]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#22C55E]">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.8"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="font-fira-code text-xl text-[#F8FAFC] mb-1">
            Ginko 管理后台
          </h1>
          <p className="font-fira-sans text-sm text-[#94A3B8]">
            登录以管理您的项目
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block font-fira-sans text-sm text-[#94A3B8] mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
                placeholder="请输入用户名"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-fira-sans text-sm text-[#94A3B8] mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#020617] border border-[#1E293B] rounded-xl text-[#F8FAFC] font-fira-sans text-sm outline-none transition-all duration-200 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/20"
                placeholder="请输入密码"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
                <span className="font-fira-sans text-sm text-red-400">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-fira-sans font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  登录中...
                </span>
              ) : '登 录'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-fira-sans text-xs text-[#475569]">
          基于 JWT 身份验证
        </p>
      </div>
    </div>
  );
}
