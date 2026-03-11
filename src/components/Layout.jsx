import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ children, session }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <nav className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-serif text-stone-800 hover:text-stone-600">
            CalliApp
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Practice
            </Link>
            <Link
              to="/progress"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/progress' ? 'bg-stone-100 text-stone-800' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Progress
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
