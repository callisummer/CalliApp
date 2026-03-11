import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Tabs, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const TIMELINES = [
  { label: '1 Year', value: '1-year' },
  { label: '3 Years', value: '3-year' },
  { label: '5 Years', value: '5-year' },
  { label: '10 Years', value: '10-year' },
]

const AREAS = ['Career & Purpose', 'Money & Wealth', 'Health & Body', 'Love & Relationships', 'Spiritual Growth', 'Creative Life', 'Home & Environment', 'Education', 'Travel & Adventure', 'Other']

const AREA_ICONS = {
  'Career & Purpose': '✨', 'Money & Wealth': '💛', 'Health & Body': '💚', 'Love & Relationships': '💖',
  'Spiritual Growth': '🌿', 'Creative Life': '🎨', 'Home & Environment': '🏡', 'Education': '📚',
  'Travel & Adventure': '✈️', 'Other': '✦',
}

const STATUS_OPTIONS = ['active', 'achieved', 'revised', 'released']

export default function LifePlan({ session }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeline, setTimeline] = useState('1-year')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', area: '', timeline: '1-year', why: '', steps: '', target_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('goals').select('*').eq('user_id', session.user.id).order('created_at')
    setGoals(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('goals').insert({
      user_id: session.user.id,
      ...form,
      timeline: form.timeline || timeline,
      target_date: form.target_date || null,
    }).select().single()
    if (data) setGoals(prev => [...prev, data])
    setForm({ title: '', description: '', area: '', timeline: '1-year', why: '', steps: '', target_date: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const updates = { status }
    if (status === 'achieved') updates.achieved_at = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('goals').update(updates).eq('id', id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === data.id ? data : g))
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const timelineGoals = goals.filter(g => g.timeline === timeline)
  const byArea = AREAS.reduce((acc, area) => {
    const areaGoals = timelineGoals.filter(g => g.area === area)
    if (areaGoals.length > 0) acc[area] = areaGoals
    return acc
  }, {})
  const noArea = timelineGoals.filter(g => !g.area || !AREAS.includes(g.area))
  if (noArea.length > 0) byArea['Other'] = [...(byArea['Other'] || []), ...noArea]

  const achieved = timelineGoals.filter(g => g.status === 'achieved').length
  const active = timelineGoals.filter(g => g.status === 'active').length

  return (
    <div>
      <SectionHeader title="Life Plan" subtitle="Your vision across time — clear, bold, and alive">
        <Button onClick={() => { setForm(f => ({ ...f, timeline })); setShowModal(true) }} variant="gold">+ Add Goal</Button>
      </SectionHeader>

      <Tabs tabs={TIMELINES} active={timeline} onChange={setTimeline} />

      {timelineGoals.length > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: 'white', border: '1px solid var(--brown-100)' }}>
          <div className="text-center">
            <p className="font-serif text-2xl" style={{ color: 'var(--gold-dark)' }}>{active}</p>
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Active Goals</p>
          </div>
          <div className="w-px h-10" style={{ background: 'var(--brown-100)' }} />
          <div className="text-center">
            <p className="font-serif text-2xl" style={{ color: '#065F46' }}>{achieved}</p>
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Achieved</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{TIMELINES.find(t => t.value === timeline)?.label} Vision</p>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        timelineGoals.length === 0 ? (
          <EmptyState
            icon="🌟"
            title={`No ${TIMELINES.find(t => t.value === timeline)?.label} goals yet`}
            description="What do you want your life to look like? Set bold, intentional goals."
            action={<Button onClick={() => setShowModal(true)} variant="gold">Set Your First Goal</Button>}
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(byArea).map(([area, areaGoals]) => (
              <div key={area}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{AREA_ICONS[area]}</span>
                  <h2 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>{area}</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pl-6">
                  {areaGoals.map(goal => (
                    <Card key={goal.id} className={`p-4 ${goal.status === 'achieved' ? '' : ''}`} goldHover
                      style={goal.status === 'achieved' ? { border: '2px solid var(--gold)' } : {}}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge status={goal.status} />
                            {goal.status === 'achieved' && <span className="text-base">🎉</span>}
                          </div>
                          <h3 className="text-sm font-medium" style={{ color: 'var(--brown-900)', textDecoration: goal.status === 'released' ? 'line-through' : 'none', opacity: goal.status === 'released' ? 0.5 : 1 }}>
                            {goal.title}
                          </h3>
                        </div>
                        <button onClick={() => deleteGoal(goal.id)} className="text-xs ml-2" style={{ color: 'var(--brown-300)' }}>✕</button>
                      </div>

                      {goal.description && <p className="text-xs mb-2" style={{ color: 'var(--brown-700)' }}>{goal.description}</p>}

                      {goal.why && (
                        <div className="p-2.5 rounded-lg mb-2" style={{ background: 'var(--cream)' }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--brown-500)' }}>Why this matters</p>
                          <p className="text-xs" style={{ color: 'var(--brown-700)' }}>{goal.why}</p>
                        </div>
                      )}

                      {goal.target_date && <p className="text-xs mb-2" style={{ color: 'var(--gold-dark)' }}>🎯 {goal.target_date}</p>}

                      <div className="flex gap-1 flex-wrap mt-3">
                        {STATUS_OPTIONS.filter(s => s !== goal.status).map(s => (
                          <button key={s} onClick={() => updateStatus(goal.id, s)} className="text-xs px-2 py-0.5 rounded capitalize transition-all" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>
                            {s === 'achieved' ? '✓ Achieved' : s}
                          </button>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Life Goal" width="max-w-xl">
        <div className="space-y-4">
          <Input label="Goal Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you want to create, become, or have?" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Paint the picture..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Life Area" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} options={AREAS} />
            <Select label="Timeline" value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))} options={TIMELINES.map(t => ({ value: t.value, label: t.label }))} />
          </div>
          <Textarea label="Why This Matters" value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} rows={2} placeholder="The deeper reason behind this goal..." />
          <Textarea label="Action Steps" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} rows={3} placeholder="The steps you'll take to get there..." />
          <Input label="Target Date" type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Goal'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
