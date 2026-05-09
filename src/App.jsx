import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Skills from './pages/Skills'
import Readiness from './pages/Readiness'
import Resume from './pages/Resume'
import Planner from './pages/Planner'
import Applications from './pages/Applications'
import Interview from './pages/Interview'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-white">Loading...</p></div>
  return user ? children : <Navigate to="/" />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-white">Loading...</p></div>
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      <Route path="/skills" element={
        <PrivateRoute>
          <Skills />
        </PrivateRoute>
      } />
      <Route path="/readiness" element={
        <PrivateRoute>
          <Readiness />
        </PrivateRoute>
      } />
      <Route path="/resume" element={
        <PrivateRoute>
          <Resume />
        </PrivateRoute>
      } />
      <Route path="/planner" element={
        <PrivateRoute>
          <Planner />
        </PrivateRoute>
      } />
      <Route path="/applications" element={
        <PrivateRoute>
          <Applications />
        </PrivateRoute>
      } />
      <Route path="/interview" element={
        <PrivateRoute>
          <Interview />
        </PrivateRoute>
      } />
    </Routes>

  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
