import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const CATEGORIES = ['spiritual', 'self-care', 'fitness', 'creative', 'other']
const FREQUENCIES = ['daily', 'weekdays', 'weekends', '3x/week', 'weekly', 'as needed']

const CATEGORY_COLORS = {
  spiritual: { bg: '#EDE9FE', color: '#5B21B6' },
  'self-care': { bg: '#FCE7F3', color: '#9D174D' },
  fitness: { bg: '#D1FAE5', color: '#065F46' },
  creative: { bg: '#FEF3C7', color: '#92400E' },
  other: { bg: '#F3F4F6', color: '#6B7280' },
}

const today = new Date().toISOString().slice(0, 10)

export default function Practices({ session }) {
  const [practices, setPractices] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'spiritual', frequency: 'daily', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('practices').select('*').eq('user_id', session.user.id).eq('is_active', true).order('sort_order'),
      supabase.from('practice_logs').select('*').eq('user_id', session.user.id).gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
    ])
    setPractices(p || [])
    setLogs(l || [])
    setLoading(false)
  }

  async function toggleToday(practice) {
    const existing = logs.find(l => l.practice_id === practice.id && l.date === today)
    if (existing) {
      await supabase.from('practice_logs').delete().eq('id', existing.id)
      setLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('practice_logs').insert({
        user_id: session.user.id,
        practice_id: practice.id,
        date: today,
      }).select().single()
      if (data) setLogs(prev => [...prev, data])
    }
  }

  async function addPractice() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('practices').insert({
      user_id: session.user.id,
      ...form,
    }).select().single()
    if (data) setPractices(prev => [...prev, data])
    setForm({ name: '', category: 'spiritual', frequency: 'daily', description: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deletePractice(id) {
    await supabase.from('practices').update({ is_active: false }).eq('id', id)
    setPractices(prev => prev.filter(p => p.id !== id))
  }

  function isDoneToday(practiceId) {
    return logs.some(l => l.practice_id === practiceId && l.date === today)
  }

  function getStreak(practiceId) {
    let streak = 0
    const d = new Date()
    while (true) {
      const dateStr = d.toISOString().slice(0, 10)
      if (logs.some(l => l.practice_id === practiceId && l.date === dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }

  const todayDone = practices.filter(p => isDoneToday(p.id)).length
  const total = practices.length

  return (
    <div>
      <SectionHeader title="Practices & Rituals" subtitle="The sacred acts that shape your becoming">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Practice</Button>
      </SectionHeader>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          {practices.length > 0 && (
            <Card className="p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-serif text-2xl" style={{ color: 'var(--brown-900)' }}>
                  {todayDone} / {total}
                </p>
                <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Completed today</p>
              </div>
              <div className="flex gap-1">
                {practices.map(p => (
                  <div
                    key={p.id}
                    className="w-3 h-3 rounded-full transition-all"
                    style={{ background: isDoneToday(p.id) ? 'var(--gold)' : 'var(--brown-100)' }}
                    title={p.name}
                  />
                ))}
              </div>
            </Card>
          )}

          {practices.length === 0 ? (
            <EmptyState
              icon="🌸"
              title="No practices yet"
              description="Add your daily rituals and spiritual practices to track your consistency."
              action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Practice</Button>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {practices.map(practice => {
                const done = isDoneToday(practice.id)
                const streak = getStreak(practice.id)
                const colors = CATEGORY_COLORS[practice.category] || CATEGORY_COLORS.other
                return (
                  <Card key={practice.id} className="p-5" goldHover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: colors.bg, color: colors.color }}
                          >
                            {practice.category}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{practice.frequency}</span>
                        </div>
                        <h3 className="font-medium text-base" style={{ color: 'var(--brown-900)' }}>{practice.name}</h3>
                        {practice.description && (
                          <p className="text-xs mt-1" style={{ color: 'var(--brown-500)' }}>{practice.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {streak > 0 && (
                          <span className="text-xs" style={{ color: 'var(--gold)' }}>
                            🔥 {streak} day streak
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deletePractice(practice.id)}
                          className="text-xs px-2 py-1 rounded-lg transition-all"
                          style={{ color: 'var(--brown-300)' }}
                          onMouseEnter={e => e.target.style.color = '#991B1B'}
                          onMouseLeave={e => e.target.style.color = 'var(--brown-300)'}
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => toggleToday(practice)}
                          className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: done ? 'var(--gold)' : 'var(--brown-900)',
                            color: done ? 'var(--brown-900)' : 'var(--cream)',
                          }}
                        >
                          {done ? '✓ Done' : 'Check In'}
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add a Practice">
        <div className="space-y-4">
          <Input label="Practice Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Morning meditation, journaling, yoga..." />
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} />
          <Select label="Frequency" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} options={FREQUENCIES} />
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Notes about this practice..." rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={addPractice} variant="gold" disabled={saving || !form.name.trim()} className="flex-1">
              {saving ? 'Adding...' : 'Add Practice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
