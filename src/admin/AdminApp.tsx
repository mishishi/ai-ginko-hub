import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';

export default function AdminApp() {
  const { token, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Routes added in Task 9 */}
      </Route>
    </Routes>
  );
}
