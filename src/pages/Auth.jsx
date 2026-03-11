import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--brown-900)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 text-9xl" style={{ color: 'var(--gold)' }}>✦</div>
          <div className="absolute bottom-40 right-16 text-7xl" style={{ color: 'var(--gold)' }}>✦</div>
          <div className="absolute top-1/2 left-1/3 text-5xl" style={{ color: 'var(--gold)' }}>✦</div>
        </div>
        <div className="relative text-center">
          <div className="text-7xl mb-8" style={{ color: 'var(--gold)' }}>✦</div>
          <h1 className="font-serif text-5xl font-light mb-6 leading-tight" style={{ color: 'var(--gold-light)' }}>
            My Life<br />Dashboard
          </h1>
          <p className="text-lg font-light leading-relaxed max-w-sm" style={{ color: 'var(--brown-300)' }}>
            Your sacred space for intentional living, healing, and becoming everything you are meant to be.
          </p>
          <div className="mt-12 space-y-3">
            {['Daily Intentions & Rituals', 'Money & Wealth Building', 'Hair Business & Brand', 'Growth & Plant Medicine'].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--brown-300)' }}>
                <span style={{ color: 'var(--gold)' }}>✦</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: 'var(--cream)' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="text-5xl mb-3" style={{ color: 'var(--gold)' }}>✦</div>
            <h1 className="font-serif text-3xl" style={{ color: 'var(--brown-900)' }}>My Life Dashboard</h1>
          </div>

          <div className="mb-10">
            <h2 className="font-serif text-4xl font-medium mb-2" style={{ color: 'var(--brown-900)' }}>
              {mode === 'login' ? 'Welcome Back' : 'Begin Your Journey'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
              {mode === 'login' ? 'Sign in to your sacred space' : 'Create your personal life dashboard'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid var(--brown-100)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brown-700)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'var(--cream)',
                    border: '1.5px solid var(--brown-100)',
                    color: 'var(--brown-900)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--brown-100)'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brown-700)' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'var(--cream)',
                    border: '1.5px solid var(--brown-100)',
                    color: 'var(--brown-900)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--brown-100)'}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                  {error}
                </div>
              )}
              {message && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#D1FAE5', color: '#065F46' }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                style={{ background: 'var(--brown-900)', color: 'var(--cream)' }}
                onMouseEnter={e => !loading && (e.target.style.background = 'var(--brown-800)')}
                onMouseLeave={e => e.target.style.background = 'var(--brown-900)'}
              >
                {loading ? 'Just a moment...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--brown-100)' }}>
              <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
                  className="font-medium underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--gold-dark)' }}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs mt-8" style={{ color: 'var(--brown-300)' }}>
            Your space. Your journey. Protected & private.
          </p>
        </div>
      </div>
    </div>
  )
}
