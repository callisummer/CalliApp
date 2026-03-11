import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  {
    category: 'Daily Living',
    emoji: '☀️',
    links: [
      { label: 'Daily Intentions', path: '/daily/intentions' },
      { label: 'Practices & Rituals', path: '/daily/practices' },
      { label: 'Health & Body', path: '/daily/health' },
      { label: 'Mindset & Healing', path: '/daily/mindset' },
    ],
  },
  {
    category: 'Money & Wealth',
    emoji: '💛',
    links: [
      { label: 'Finances & Budget', path: '/money/finances' },
      { label: 'Expense Tracker', path: '/money/expenses' },
      { label: 'Debt Payoff', path: '/money/debt' },
      { label: 'Credit Plan', path: '/money/credit' },
      { label: 'Wealth Building', path: '/money/wealth' },
      { label: 'Dream Home', path: '/money/dream-home' },
    ],
  },
  {
    category: 'Business & Career',
    emoji: '✨',
    links: [
      { label: 'Hair Clients', path: '/business/clients' },
      { label: 'Hair Business', path: '/business/hair' },
      { label: 'Business Planning', path: '/business/planning' },
      { label: 'Personal Brand', path: '/business/brand' },
      { label: 'Digital Presence', path: '/business/digital' },
      { label: 'Content Ideas', path: '/business/content' },
      { label: 'Testimonials', path: '/business/testimonials' },
    ],
  },
  {
    category: 'Growth & Learning',
    emoji: '🌱',
    links: [
      { label: 'Library', path: '/growth/library' },
      { label: 'Plant Medicine', path: '/growth/plant-medicine' },
      { label: 'Coaching Modalities', path: '/growth/coaching' },
      { label: 'Life Plan', path: '/growth/life-plan' },
      { label: 'Dreams & Goals', path: '/growth/dreams' },
    ],
  },
  {
    category: 'Relationships',
    emoji: '💖',
    links: [
      { label: 'People I Love', path: '/relationships/people' },
      { label: 'Mentors & Teachers', path: '/relationships/mentors' },
      { label: 'Community', path: '/relationships/community' },
      { label: 'Travel & Bucket List', path: '/relationships/travel' },
    ],
  },
  {
    category: 'Creative & Soul',
    emoji: '🎨',
    links: [
      { label: 'Creative Life', path: '/creative/projects' },
      { label: 'Letter to Future Self', path: '/creative/future-letter' },
      { label: 'Mission & Legacy', path: '/creative/mission' },
      { label: 'My Ideal Life', path: '/creative/ideal-life' },
    ],
  },
]

export default function Sidebar({ session, onClose }) {
  const location = useLocation()
  const activeCategory = NAV.find(cat => cat.links.some(l => location.pathname === l.path))?.category
  const [collapsed, setCollapsed] = useState({})

  function toggleCategory(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--brown-900)', color: 'var(--cream)' }}
    >
      {/* Logo */}
      <div className="p-6 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl" style={{ color: 'var(--gold)' }}>✦</span>
          <span className="font-serif text-base font-medium" style={{ color: 'var(--gold-light)' }}>
            My Life Dashboard
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--brown-300)' }}>×</button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map(cat => {
          const isOpen = collapsed[cat.category] === undefined
            ? (cat.category === activeCategory || !activeCategory)
            : !collapsed[cat.category]

          return (
            <div key={cat.category} className="mb-2">
              <button
                onClick={() => toggleCategory(cat.category)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left group transition-all"
                style={{ color: 'var(--gold)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
                    {cat.category}
                  </span>
                </div>
                <span
                  className="text-xs transition-transform duration-200"
                  style={{
                    color: 'var(--brown-500)',
                    display: 'inline-block',
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }}
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="mt-1 space-y-0.5 pl-1">
                  {cat.links.map(link => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={onClose}
                      className="block"
                    >
                      {({ isActive }) => (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            color: isActive ? 'var(--gold-light)' : 'var(--brown-300)',
                            background: isActive ? 'rgba(201,165,90,0.1)' : 'transparent',
                            borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                          }}
                          onMouseEnter={e => !isActive && (e.currentTarget.style.color = 'var(--cream)')}
                          onMouseLeave={e => !isActive && (e.currentTarget.style.color = 'var(--brown-300)')}
                        >
                          {link.label}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mb-3">
          <p className="text-xs truncate" style={{ color: 'var(--brown-500)' }}>
            {session?.user?.email}
          </p>
        </div>
        <button
          onClick={signOut}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
          style={{
            color: 'var(--brown-300)',
            background: 'rgba(255,255,255,0.04)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'var(--cream)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = 'var(--brown-300)'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
