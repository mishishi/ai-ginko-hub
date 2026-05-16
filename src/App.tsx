import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectDetail from './pages/ProjectDetail'
import About from './pages/About'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}
