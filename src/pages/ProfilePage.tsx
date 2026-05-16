import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import Header from '../components/Header';

export default function ProfilePage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isSignedIn) {
      window.location.href = '/';
    }
  }, [isSignedIn]);

  if (!isSignedIn || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <span className="text-text-muted">加载中...</span>
        </main>
      </div>
    );
  }

  const name = user.fullName ?? user.username ?? '用户';
  const email = user.emailAddresses[0]?.emailAddress;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-heading text-3xl text-text-primary mb-6">个人中心</h1>

          <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-full ring-2 ring-border"
                />
              )}
              <div>
                <p className="font-heading text-xl text-text-primary">{name}</p>
                {email && (
                  <p className="text-sm text-text-muted">{email}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/favorites"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200 text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                我的收藏
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
