import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Skills', path: '/skills' },
  { label: 'Readiness', path: '/readiness' },
  { label: 'Resume', path: '/resume' },
  { label: 'Planner', path: '/planner' },
  { label: 'Applications', path: '/applications' },
  { label: 'Interview', path: '/interview' },
]

export default function AppShell({ title, subtitle, actions, children, maxWidth = 'max-w-6xl' }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/95 sticky top-0 z-20 backdrop-blur">
        <div className="px-5 md:px-8 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-left text-xl font-bold text-blue-400"
            >
              AI Career OS
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-gray-500">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition"
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className={`${maxWidth} mx-auto px-5 md:px-8 py-8 md:py-10`}>
        {(title || subtitle || actions) && (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {title && <h1 className="text-3xl md:text-4xl font-bold tracking-normal">{title}</h1>}
              {subtitle && <p className="mt-2 max-w-2xl text-gray-400">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
