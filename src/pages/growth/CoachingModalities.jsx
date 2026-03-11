import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const STATUSES = ['exploring', 'studying', 'certified', 'practicing']
const STATUS_COLORS = {
  exploring: { bg: '#EDE9FE', color: '#5B21B6' },
  studying: { bg: '#DBEAFE', color: '#1E40AF' },
  certified: { bg: '#D1FAE5', color: '#065F46' },
  practicing: { bg: '#FEF3C7', color: '#92400E' },
}

export default function CoachingModalities({ session }) {
  const [modalities, setModalities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', teacher: '', institution: '',
    status: 'exploring', start_date: '', cert_date: '', notes: '', how_i_use_it: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('coaching_modalities').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setModalities(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('coaching_modalities').insert({
      user_id: session.user.id,
      ...form,
      start_date: form.start_date || null,
      cert_date: form.cert_date || null,
    }).select().single()
    if (data) setModalities(prev => [data, ...prev])
    setForm({ name: '', description: '', teacher: '', institution: '', status: 'exploring', start_date: '', cert_date: '', notes: '', how_i_use_it: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('coaching_modalities').update({ status }).eq('id', id).select().single()
    if (data) setModalities(prev => prev.map(m => m.id === data.id ? data : m))
  }

  async function deleteModality(id) {
    await supabase.from('coaching_modalities').delete().eq('id', id)
    setModalities(prev => prev.filter(m => m.id !== id))
  }

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = modalities.filter(m => m.status === s)
    return acc
  }, {})

  return (
    <div>
      <SectionHeader title="Coaching Modalities" subtitle="The healing arts and tools of your practice">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Modality</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        modalities.length === 0 ? (
          <EmptyState
            icon="🌀"
            title="Your toolkit awaits"
            description="Add the coaching modalities, tools, and healing arts you're learning and practicing."
            action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Modality</Button>}
          />
        ) : (
          <div className="space-y-8">
            {STATUSES.map(status => {
              const items = byStatus[status]
              if (items.length === 0) return null
              const colors = STATUS_COLORS[status]
              return (
                <div key={status}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs uppercase tracking-widest font-medium px-3 py-1 rounded-full capitalize" style={{ background: colors.bg, color: colors.color }}>
                      {status}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--brown-100)' }} />
                    <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{items.length}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(modality => (
                      <Card key={modality.id} className="p-5" goldHover>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-serif text-base font-medium" style={{ color: 'var(--brown-900)' }}>{modality.name}</h3>
                          <button onClick={() => deleteModality(modality.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                        </div>

                        {modality.description && <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--brown-700)' }}>{modality.description}</p>}

                        <div className="space-y-1.5 text-xs mb-3" style={{ color: 'var(--brown-500)' }}>
                          {modality.teacher && <p>Teacher: <span style={{ color: 'var(--brown-700)' }}>{modality.teacher}</span></p>}
                          {modality.institution && <p>Institution: <span style={{ color: 'var(--brown-700)' }}>{modality.institution}</span></p>}
                          {modality.start_date && <p>Started: <span style={{ color: 'var(--brown-700)' }}>{modality.start_date}</span></p>}
                          {modality.cert_date && <p>Certified: <span style={{ color: '#065F46' }}>🏆 {modality.cert_date}</span></p>}
                        </div>

                        {modality.how_i_use_it && (
                          <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--cream)' }}>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--brown-500)' }}>How I use this</p>
                            <p className="text-xs" style={{ color: 'var(--brown-700)' }}>{modality.how_i_use_it}</p>
                          </div>
                        )}

                        <div className="flex gap-1 flex-wrap">
                          {STATUSES.filter(s => s !== status).map(s => {
                            const c = STATUS_COLORS[s]
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(modality.id, s)}
                                className="px-2 py-0.5 rounded text-xs capitalize transition-all"
                                style={{ background: c.bg, color: c.color }}
                              >
                                {s}
                              </button>
                            )
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Coaching Modality" width="max-w-xl">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="EFT, Somatic work, IFS, NLP..." />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this modality is and how it heals..." rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teacher / Practitioner" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} placeholder="Name" />
            <Input label="Institution / Program" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="School, org..." />
          </div>
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <Input label="Certification Date" type="date" value={form.cert_date} onChange={e => setForm(f => ({ ...f, cert_date: e.target.value }))} />
          </div>
          <Textarea label="How I Use This in My Practice" value={form.how_i_use_it} onChange={e => setForm(f => ({ ...f, how_i_use_it: e.target.value }))} rows={2} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Modality'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
