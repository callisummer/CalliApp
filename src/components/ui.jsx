import { useState } from 'react'

// Card
export function Card({ children, className = '', goldHover = false, style = {} }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm transition-all duration-200 ${goldHover ? 'hover:shadow-md hover:border-[var(--gold)]' : 'hover:shadow-md'} ${className}`}
      style={{ border: '1px solid var(--brown-100)', ...style }}
    >
      {children}
    </div>
  )
}

// SectionHeader
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-serif text-3xl font-medium mb-1" style={{ color: 'var(--brown-900)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 flex-shrink-0 ml-4">{children}</div>}
    </div>
  )
}

// Button
export function Button({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button', size = 'md' }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const styles = {
    primary: {
      background: 'var(--brown-900)',
      color: 'var(--cream)',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--brown-700)',
      border: '1.5px solid var(--brown-300)',
    },
    gold: {
      background: 'var(--gold)',
      color: 'var(--brown-900)',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--brown-500)',
      border: 'none',
    },
    danger: {
      background: '#FEE2E2',
      color: '#991B1B',
      border: 'none',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size] || sizes.md} ${className}`}
      style={styles[variant] || styles.primary}
    >
      {children}
    </button>
  )
}

// Input
export function Input({ label, value, onChange, placeholder = '', type = 'text', className = '', required = false, name }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'var(--cream)',
          border: '1.5px solid var(--brown-100)',
          color: 'var(--brown-900)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--brown-100)'}
      />
    </div>
  )
}

// Textarea
export function Textarea({ label, value, onChange, placeholder = '', rows = 4, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
        style={{
          background: 'var(--cream)',
          border: '1.5px solid var(--brown-100)',
          color: 'var(--brown-900)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--brown-100)'}
      />
    </div>
  )
}

// Select
export function Select({ label, value, onChange, options = [], className = '', placeholder = 'Select...' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
        style={{
          background: 'var(--cream)',
          border: '1.5px solid var(--brown-100)',
          color: value ? 'var(--brown-900)' : 'var(--brown-300)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--brown-100)'}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// Badge
const badgeColors = {
  todo: { bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { bg: '#FEF3C7', color: '#92400E' },
  done: { bg: '#D1FAE5', color: '#065F46' },
  idea: { bg: '#EDE9FE', color: '#5B21B6' },
  scripted: { bg: '#DBEAFE', color: '#1E40AF' },
  filmed: { bg: '#FCE7F3', color: '#9D174D' },
  published: { bg: '#D1FAE5', color: '#065F46' },
  active: { bg: '#D1FAE5', color: '#065F46' },
  paused: { bg: '#FEF3C7', color: '#92400E' },
  planning: { bg: '#DBEAFE', color: '#1E40AF' },
  exploring: { bg: '#EDE9FE', color: '#5B21B6' },
  studying: { bg: '#DBEAFE', color: '#1E40AF' },
  certified: { bg: '#D1FAE5', color: '#065F46' },
  practicing: { bg: '#FEF9C3', color: '#713F12' },
  want: { bg: '#EDE9FE', color: '#5B21B6' },
  reading: { bg: '#DBEAFE', color: '#1E40AF' },
  completed: { bg: '#D1FAE5', color: '#065F46' },
  dream: { bg: '#FCE7F3', color: '#9D174D' },
  saving: { bg: '#FEF3C7', color: '#92400E' },
  purchased: { bg: '#D1FAE5', color: '#065F46' },
  dreaming: { bg: '#FCE7F3', color: '#9D174D' },
  manifesting: { bg: '#FEF3C7', color: '#92400E' },
  achieved: { bg: '#D1FAE5', color: '#065F46' },
  wishlist: { bg: '#EDE9FE', color: '#5B21B6' },
  registered: { bg: '#DBEAFE', color: '#1E40AF' },
  attended: { bg: '#D1FAE5', color: '#065F46' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  high: { bg: '#FEE2E2', color: '#991B1B' },
  medium: { bg: '#FEF3C7', color: '#92400E' },
  low: { bg: '#D1FAE5', color: '#065F46' },
  scheduled: { bg: '#DBEAFE', color: '#1E40AF' },
  'no-show': { bg: '#FEE2E2', color: '#991B1B' },
  'in-progress': { bg: '#FEF3C7', color: '#92400E' },
  complete: { bg: '#D1FAE5', color: '#065F46' },
  'on-hold': { bg: '#F3F4F6', color: '#6B7280' },
}

export function Badge({ status, label, className = '' }) {
  const colors = badgeColors[status] || { bg: '#F3F4F6', color: '#6B7280' }
  const displayLabel = label || (status ? status.replace(/_/g, ' ').replace(/-/g, ' ') : '')
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}
      style={{ background: colors.bg, color: colors.color }}
    >
      {displayLabel}
    </span>
  )
}

// EmptyState
export function EmptyState({ icon = '✦', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4" style={{ color: 'var(--gold-light)' }}>{icon}</div>
      <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--brown-700)' }}>{title}</h3>
      {description && (
        <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--brown-300)' }}>{description}</p>
      )}
      {action}
    </div>
  )
}

// Spinner
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizes[size]} border-2 rounded-full animate-spin`}
      style={{ borderColor: 'var(--brown-100)', borderTopColor: 'var(--gold)' }}
    />
  )
}

// Modal
export function Modal({ isOpen, onClose, title, children, width = 'max-w-lg' }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto`}
        style={{ border: '1px solid var(--brown-100)' }}
      >
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid var(--brown-100)' }}>
          <h3 className="font-serif text-xl" style={{ color: 'var(--brown-900)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: 'var(--brown-300)' }}
            onMouseEnter={e => e.target.style.color = 'var(--brown-700)'}
            onMouseLeave={e => e.target.style.color = 'var(--brown-300)'}
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// SaveButton
export function SaveButton({ onClick, loading, saved, label = 'Save', className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${className}`}
      style={{
        background: saved ? 'var(--gold)' : 'var(--brown-900)',
        color: saved ? 'var(--brown-900)' : 'var(--cream)',
      }}
    >
      {loading ? 'Saving...' : saved ? '✓ Saved' : label}
    </button>
  )
}

// StarRating
export function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-xl transition-all"
          style={{ color: star <= value ? 'var(--gold)' : 'var(--brown-100)' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Tabs
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--cream-dark)' }}>
      {tabs.map(tab => (
        <button
          key={tab.value || tab}
          onClick={() => onChange(tab.value || tab)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: (tab.value || tab) === active ? 'white' : 'transparent',
            color: (tab.value || tab) === active ? 'var(--brown-900)' : 'var(--brown-500)',
            boxShadow: (tab.value || tab) === active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {tab.label || tab}
        </button>
      ))}
    </div>
  )
}

// ProgressBar
export function ProgressBar({ value, max, color = 'var(--gold)' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--brown-100)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
