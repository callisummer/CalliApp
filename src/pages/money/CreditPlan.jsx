import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner, SaveButton, ProgressBar } from '../../components/ui'

const IMPACT_TIPS = {
  high: ['Pay all bills on time — even one late payment can drop your score 60-110 points.', 'Reduce credit utilization to below 30% on each card.', 'Dispute any inaccurate items on your credit report.'],
  medium: ['Keep old accounts open to maintain credit history length.', 'Avoid opening multiple new accounts at once.', 'Ask for a credit limit increase on existing cards.'],
  low: ['Use credit monitoring to track your progress monthly.', 'Diversify credit types over time (installment + revolving).', 'Become an authorized user on a trusted person\'s account.'],
}

export default function CreditPlan({ session }) {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [currentScore, setCurrentScore] = useState('')
  const [targetScore, setTargetScore] = useState('')
  const [notes, setNotes] = useState('')
  const [form, setForm] = useState({ title: '', description: '', impact: 'high' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: acts }, { data: scoreData }, { data: noteData }] = await Promise.all([
      supabase.from('credit_actions').select('*').eq('user_id', session.user.id).order('created_at'),
      supabase.from('user_content').select('content').eq('user_id', session.user.id).eq('key', 'credit_scores').maybeSingle(),
      supabase.from('user_content').select('content').eq('user_id', session.user.id).eq('key', 'credit_notes').maybeSingle(),
    ])
    setActions(acts || [])
    if (scoreData?.content) {
      const parsed = JSON.parse(scoreData.content)
      setCurrentScore(parsed.current || '')
      setTargetScore(parsed.target || '')
    }
    setNotes(noteData?.content || '')
    setLoading(false)
  }

  async function saveNotes() {
    setSaving(true)
    await Promise.all([
      supabase.from('user_content').upsert({ user_id: session.user.id, key: 'credit_scores', content: JSON.stringify({ current: currentScore, target: targetScore }) }, { onConflict: 'user_id,key' }),
      supabase.from('user_content').upsert({ user_id: session.user.id, key: 'credit_notes', content: notes }, { onConflict: 'user_id,key' }),
    ])
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
    setSaving(false)
  }

  async function addAction() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('credit_actions').insert({ user_id: session.user.id, ...form }).select().single()
    if (data) setActions(prev => [...prev, data])
    setForm({ title: '', description: '', impact: 'high' })
    setShowModal(false)
    setSaving(false)
  }

  async function toggleStatus(action) {
    const next = action.status === 'todo' ? 'in_progress' : action.status === 'in_progress' ? 'done' : 'todo'
    const { data } = await supabase.from('credit_actions').update({ status: next }).eq('id', action.id).select().single()
    if (data) setActions(prev => prev.map(a => a.id === data.id ? data : a))
  }

  async function deleteAction(id) {
    await supabase.from('credit_actions').delete().eq('id', id)
    setActions(prev => prev.filter(a => a.id !== id))
  }

  const done = actions.filter(a => a.status === 'done').length
  const scoreGap = currentScore && targetScore ? Number(targetScore) - Number(currentScore) : null
  const scoreProgress = currentScore && targetScore ? Math.max(0, Math.min(100, ((Number(currentScore) - 300) / (Number(targetScore) - 300)) * 100)) : 0

  return (
    <div>
      <SectionHeader title="Credit Plan" subtitle="Build your credit score with strategic action">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Action</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {/* Score tracker */}
          <Card className="p-6 mb-6">
            <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>Credit Score Journey</h2>
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <Input label="Current Score" type="number" value={currentScore} onChange={e => setCurrentScore(e.target.value)} placeholder="680" />
              <Input label="Target Score" type="number" value={targetScore} onChange={e => setTargetScore(e.target.value)} placeholder="750" />
            </div>
            {currentScore && targetScore && (
              <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                  <span style={{ color: 'var(--brown-500)' }}>Current: {currentScore}</span>
                  {scoreGap !== null && <span style={{ color: 'var(--gold-dark)' }}>{scoreGap > 0 ? `+${scoreGap} points to go` : 'Goal reached! 🎉'}</span>}
                  <span style={{ color: 'var(--brown-500)' }}>Target: {targetScore}</span>
                </div>
                <ProgressBar value={Number(currentScore)} max={Number(targetScore)} color="var(--gold)" />
                <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--brown-300)' }}>
                  <span>Poor</span><span>Fair</span><span>Good</span><span>Very Good</span><span>Exceptional</span>
                </div>
              </div>
            )}
            <Textarea label="Strategy Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Your credit building plan, accounts to open, debts to pay..." rows={3} />
            <div className="flex justify-end mt-4">
              <SaveButton onClick={saveNotes} loading={saving} saved={noteSaved} label="Save" />
            </div>
          </Card>

          {/* Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>Action Items</h2>
                <span className="text-sm" style={{ color: 'var(--brown-500)' }}>{done}/{actions.length} done</span>
              </div>
              {actions.length === 0 ? (
                <EmptyState icon="✓" title="No actions yet" description="Add credit-building action items to track your progress." />
              ) : (
                <div className="space-y-3">
                  {actions.map(action => (
                    <div key={action.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <button
                        onClick={() => toggleStatus(action)}
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all text-xs"
                        style={{
                          background: action.status === 'done' ? 'var(--gold)' : action.status === 'in_progress' ? '#FEF3C7' : 'white',
                          border: `1.5px solid ${action.status === 'done' ? 'var(--gold)' : 'var(--brown-200)'}`,
                          color: action.status === 'done' ? 'var(--brown-900)' : 'transparent',
                        }}
                      >
                        ✓
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm" style={{ color: 'var(--brown-900)', textDecoration: action.status === 'done' ? 'line-through' : 'none', opacity: action.status === 'done' ? 0.6 : 1 }}>
                            {action.title}
                          </span>
                          <Badge status={action.impact} />
                        </div>
                        {action.description && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{action.description}</p>}
                      </div>
                      <button onClick={() => deleteAction(action.id)} className="text-xs flex-shrink-0" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Tips */}
            <Card className="p-5">
              <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Credit Building Tips</h2>
              <div className="space-y-4">
                {Object.entries(IMPACT_TIPS).map(([impact, tips]) => (
                  <div key={impact}>
                    <Badge status={impact} label={`${impact} impact`} className="mb-2" />
                    <ul className="space-y-1.5">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--brown-700)' }}>
                          <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✦</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Credit Action">
        <div className="space-y-4">
          <Input label="Action Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Pay down Visa card to 30% utilization" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="More details..." rows={2} />
          <Select label="Impact Level" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} options={['high', 'medium', 'low']} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={addAction} variant="gold" disabled={saving} className="flex-1">Add Action</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
