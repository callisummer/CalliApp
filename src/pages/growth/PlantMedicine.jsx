import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const ENTRY_TYPES = ['Study Notes', 'Ceremony Preparation', 'Integration Journal', 'Teacher Notes', 'Lineage', 'Ceremony Experience']
const PLANTS = ['Ayahuasca', 'Psilocybin', 'San Pedro', 'Kambo', 'Bufo', 'Cannabis', 'Tobacco', 'Cacao', 'Other']

const TYPE_COLORS = {
  'Study Notes': { bg: '#DBEAFE', color: '#1E40AF' },
  'Ceremony Preparation': { bg: '#FEF3C7', color: '#92400E' },
  'Integration Journal': { bg: '#D1FAE5', color: '#065F46' },
  'Teacher Notes': { bg: '#EDE9FE', color: '#5B21B6' },
  'Lineage': { bg: '#FEE2E2', color: '#991B1B' },
  'Ceremony Experience': { bg: '#FCE7F3', color: '#9D174D' },
}

export default function PlantMedicine({ session }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'Study Notes', plant: '', teacher: '', lineage: '',
    date: '', content: '', intentions: '', insights: '', integration: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('plant_medicine').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('plant_medicine').insert({
      user_id: session.user.id,
      ...form,
      date: form.date || null,
    }).select().single()
    if (data) {
      setEntries(prev => [data, ...prev])
      setSelected(data)
    }
    setForm({ title: '', type: 'Study Notes', plant: '', teacher: '', lineage: '', date: '', content: '', intentions: '', insights: '', integration: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deleteEntry(id) {
    await supabase.from('plant_medicine').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div>
      <SectionHeader title="Plant Medicine" subtitle="Your sacred learning & ceremonial journey">
        <Button onClick={() => setShowModal(true)} variant="gold">+ New Entry</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Entry list */}
          <div className="lg:col-span-1 space-y-2">
            {entries.length === 0 ? (
              <EmptyState icon="🌿" title="Your sacred journal awaits" description="Document your plant medicine journey, teachings, and integration." action={<Button onClick={() => setShowModal(true)} variant="gold" size="sm">Add Entry</Button>} />
            ) : entries.map(entry => {
              const colors = TYPE_COLORS[entry.type] || TYPE_COLORS['Study Notes']
              const isSelected = selected?.id === entry.id
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelected(isSelected ? null : entry)}
                  className="p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: isSelected ? 'var(--brown-900)' : 'white',
                    border: `1px solid ${isSelected ? 'var(--brown-900)' : 'var(--brown-100)'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.1)' : colors.bg, color: isSelected ? 'var(--gold-light)' : colors.color }}
                    >
                      {entry.type}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }} className="text-xs" style={{ color: isSelected ? 'var(--brown-500)' : 'var(--brown-300)' }}>✕</button>
                  </div>
                  <p className="text-sm font-medium mt-1" style={{ color: isSelected ? 'var(--cream)' : 'var(--brown-900)' }}>{entry.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {entry.plant && <span className="text-xs" style={{ color: isSelected ? 'var(--brown-300)' : 'var(--brown-500)' }}>🌿 {entry.plant}</span>}
                    {entry.date && <span className="text-xs" style={{ color: isSelected ? 'var(--brown-300)' : 'var(--brown-500)' }}>{entry.date}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Entry detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6">
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge status={selected.type} label={selected.type} />
                    {selected.plant && <span className="text-sm" style={{ color: 'var(--brown-500)' }}>🌿 {selected.plant}</span>}
                    {selected.date && <span className="text-sm" style={{ color: 'var(--brown-500)' }}>{selected.date}</span>}
                  </div>
                  <h2 className="font-serif text-2xl" style={{ color: 'var(--brown-900)' }}>{selected.title}</h2>
                  {selected.teacher && <p className="text-sm mt-1" style={{ color: 'var(--brown-500)' }}>Teacher: {selected.teacher}</p>}
                  {selected.lineage && <p className="text-sm" style={{ color: 'var(--brown-500)' }}>Lineage: {selected.lineage}</p>}
                </div>

                {[
                  { label: 'Content / Notes', value: selected.content },
                  { label: 'Intentions', value: selected.intentions },
                  { label: 'Insights & Revelations', value: selected.insights },
                  { label: 'Integration', value: selected.integration },
                ].filter(s => s.value).map(section => (
                  <div key={section.label} className="mb-5">
                    <h3 className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: 'var(--gold)' }}>{section.label}</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brown-700)' }}>{section.value}</p>
                  </div>
                ))}
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm" style={{ color: 'var(--brown-300)' }}>Select an entry to read it</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Plant Medicine Entry" width="max-w-2xl">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Name this entry..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Entry Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={ENTRY_TYPES} />
            <Select label="Plant / Medicine" value={form.plant} onChange={e => setForm(f => ({ ...f, plant: e.target.value }))} options={PLANTS} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Teacher" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} placeholder="Guide name" />
            <Input label="Lineage / Tradition" value={form.lineage} onChange={e => setForm(f => ({ ...f, lineage: e.target.value }))} placeholder="Shipibo, Mazatec..." />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <Textarea label="Content / Notes" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write freely..." rows={4} />
          <Textarea label="Intentions" value={form.intentions} onChange={e => setForm(f => ({ ...f, intentions: e.target.value }))} placeholder="What are you seeking, healing, or releasing?" rows={2} />
          <Textarea label="Insights & Revelations" value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))} placeholder="What arose, what was shown..." rows={3} />
          <Textarea label="Integration Notes" value={form.integration} onChange={e => setForm(f => ({ ...f, integration: e.target.value }))} placeholder="How you're integrating this into life..." rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Entry'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
