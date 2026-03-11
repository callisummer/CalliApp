import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, EmptyState, Spinner } from '../../components/ui'

export default function Mentors({ session }) {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', specialty: '', relationship: '', contact: '', website: '', what_i_learn: '', notes: '', gratitude: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('mentors').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setMentors(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('mentors').insert({ user_id: session.user.id, ...form }).select().single()
    if (data) setMentors(prev => [data, ...prev])
    setForm({ name: '', specialty: '', relationship: '', contact: '', website: '', what_i_learn: '', notes: '', gratitude: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deleteMentor(id) {
    await supabase.from('mentors').delete().eq('id', id)
    setMentors(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div>
      <SectionHeader title="Mentors & Teachers" subtitle="The wise ones who help you grow">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Mentor</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        mentors.length === 0 ? (
          <EmptyState icon="🌟" title="No mentors yet" description="Document the teachers, coaches, and mentors who guide your path." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Mentor</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {mentors.map(mentor => (
              <Card key={mentor.id} className="p-5" goldHover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-lg font-medium" style={{ color: 'var(--brown-900)' }}>{mentor.name}</h3>
                    {mentor.specialty && <p className="text-sm" style={{ color: 'var(--gold-dark)' }}>{mentor.specialty}</p>}
                    {mentor.relationship && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{mentor.relationship}</p>}
                  </div>
                  <button onClick={() => deleteMentor(mentor.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                </div>

                {mentor.what_i_learn && (
                  <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--brown-500)' }}>What I learn from them</p>
                    <p className="text-sm" style={{ color: 'var(--brown-700)' }}>{mentor.what_i_learn}</p>
                  </div>
                )}

                {mentor.gratitude && (
                  <div className="p-3 rounded-xl mb-3" style={{ background: '#FFFBF0', border: '1px solid var(--gold-light)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--gold-dark)' }}>✦ Gratitude</p>
                    <p className="text-sm italic" style={{ color: 'var(--brown-700)' }}>{mentor.gratitude}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--brown-500)' }}>
                  {mentor.contact && <span>{mentor.contact}</span>}
                  {mentor.website && (
                    <a href={mentor.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-dark)' }}>
                      Website →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Mentor or Teacher" width="max-w-xl">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Specialty / Area" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Plant medicine, business..." />
            <Input label="Relationship Type" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Personal mentor, author..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Email, phone..." />
            <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          </div>
          <Textarea label="What I Learn From Them" value={form.what_i_learn} onChange={e => setForm(f => ({ ...f, what_i_learn: e.target.value }))} rows={3} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <Textarea label="Gratitude" value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))} placeholder="What you're grateful for about this person..." rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Mentor'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
