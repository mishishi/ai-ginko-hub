import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import ProjectDetail from './pages/ProjectDetail'
import About from './pages/About'
import FavoritesPage from './pages/FavoritesPage'
import ProfilePage from './pages/ProfilePage'
import NotFound from './pages/NotFound'
import AdminApp from './admin/AdminApp'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-elevated, #1a1a1c)',
            color: 'var(--color-text-primary, #ece8e3)',
            border: '1px solid var(--color-border, #2a2a2d)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#c97d5c',
              secondary: '#1a1a1c',
            },
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#7d9a8e',
              secondary: '#1a1a1c',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
