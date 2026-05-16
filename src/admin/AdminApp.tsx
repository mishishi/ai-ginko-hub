import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectFormPage from './pages/ProjectFormPage';

function AdminRoutes() {
  const { token, isLoading } = useAdminAuth();
  console.log('[AdminRoutes] render', { token: !!token, isLoading, path: window.location.pathname });

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
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<Navigate to="/admin" replace />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  );
}
