import { useState, useCallback } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);
      try {
        await login(username, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setIsLoading(false);
      }
    },
    [username, password, login],
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs p-6 bg-bg-surface border border-border rounded-lg"
      >
        <h1 className="text-xl font-heading text-text-primary">Admin Login</h1>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 bg-bg-elevated border border-border rounded text-text-primary focus:outline-none focus:border-accent"
            required
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 bg-bg-elevated border border-border rounded text-text-primary focus:outline-none focus:border-accent"
            required
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-accent text-white rounded hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
