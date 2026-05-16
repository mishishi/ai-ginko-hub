import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Header from '../components/Header';

export default function ErrorPage() {
  const error = useRouteError();

  // 404 errors render the NotFound component via the * route
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="font-heading text-8xl text-text-muted mb-4" aria-hidden="true">
              404
            </div>
            <h1 className="font-heading text-2xl text-text-primary mb-3">
              页面未找到
            </h1>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              你访问的页面不存在或已被移除。
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-bg-base rounded-xl text-sm font-medium hover:bg-accent-dim transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="font-heading text-8xl text-text-muted mb-4" aria-hidden="true">
            500
          </div>
          <h1 className="font-heading text-2xl text-text-primary mb-3">
            服务器错误
          </h1>
          <p className="text-text-secondary mb-8 max-w-sm mx-auto">
            抱歉，服务器遇到了意外情况，请稍后重试。
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-bg-base rounded-xl text-sm font-medium hover:bg-accent-dim transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
