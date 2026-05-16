import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="text-accent">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h1 className="font-heading text-2xl text-text-primary">出现了一些问题</h1>
          </div>
          <p className="text-sm text-text-secondary max-w-md">
            发生了意外错误，请尝试刷新页面。如果问题持续存在，请联系管理员。
          </p>
          <Link
            to="/"
            className="px-5 py-2 rounded-full bg-accent text-bg-base text-sm font-medium hover:bg-accent-dim transition-colors duration-200"
          >
            返回首页
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
