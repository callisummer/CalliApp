import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ session, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block fixed left-0 top-0 h-screen z-40 overflow-hidden"
        style={{ width: '280px' }}
      >
        <Sidebar session={session} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full overflow-hidden" style={{ width: '280px' }}>
            <Sidebar session={session} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--brown-900)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: 'var(--gold)' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="12" x2="17" y2="12" />
            <line x1="3" y1="18" x2="17" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--gold)' }}>✦</span>
          <span className="font-serif text-sm" style={{ color: 'var(--gold-light)' }}>My Life Dashboard</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="lg:pl-[280px] pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
