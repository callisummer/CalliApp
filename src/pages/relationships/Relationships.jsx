import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, EmptyState, Spinner } from '../../components/ui'

const RELATIONSHIP_TYPES = ['Partner', 'Family', 'Best Friend', 'Friend', 'Colleague', 'Mentor', 'Community', 'Other']

function daysUntilBirthday(birthday) {
  if (!birthday) return null
  const today = new Date()
  const bday = new Date(birthday)
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

export default function Relationships({ session }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ name: '', relationship: '', birthday: '', contact: '', location: '', how_we_met: '', why_important: '', notes: '', last_contact: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('relationships').select('*').eq('user_id', session.user.id).order('name')
    setPeople(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('relationships').insert({
      user_id: session.user.id,
      ...form,
      birthday: form.birthday || null,
      last_contact: form.last_contact || null,
    }).select().single()
    if (data) { setPeople(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setSelected(data) }
    setForm({ name: '', relationship: '', birthday: '', contact: '', location: '', how_we_met: '', why_important: '', notes: '', last_contact: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deletePerson(id) {
    await supabase.from('relationships').delete().eq('id', id)
    setPeople(prev => prev.filter(p => p.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const upcomingBirthdays = people.filter(p => {
    const days = daysUntilBirthday(p.birthday)
    return days !== null && days <= 30
  }).sort((a, b) => daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday))

  const filtered = filter === 'All' ? people : people.filter(p => p.relationship === filter)

  return (
    <div>
      <SectionHeader title="People I Love" subtitle="The sacred circles of your life">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Person</Button>
      </SectionHeader>

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card className="p-4 mb-6" style={{ border: '2px solid var(--gold)', background: '#FFFBF0' }}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--gold-dark)' }}>🎂 Upcoming Birthdays</p>
          <div className="flex gap-4 flex-wrap">
            {upcomingBirthdays.map(p => {
              const days = daysUntilBirthday(p.birthday)
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--gold)', color: 'var(--brown-900)' }}>
                    {days === 0 ? 'Today! 🎉' : `in ${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        {['All', ...RELATIONSHIP_TYPES].map(t => (
          <button key={t} onClick={() => setFilter(t)} className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: filter === t ? 'var(--brown-900)' : 'white', color: filter === t ? 'var(--cream)' : 'var(--brown-500)', border: '1px solid var(--brown-100)' }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {filtered.length === 0 ? (
              <EmptyState icon="💖" title="No people yet" description="Add the people who matter most to you." action={<Button onClick={() => setShowModal(true)} variant="gold" size="sm">Add Person</Button>} />
            ) : filtered.map(person => {
              const days = daysUntilBirthday(person.birthday)
              const birthdaySoon = days !== null && days <= 30
              const isSelected = selected?.id === person.id
              return (
                <div key={person.id} onClick={() => setSelected(isSelected ? null : person)} className="p-4 rounded-2xl cursor-pointer transition-all"
                  style={{ background: isSelected ? 'var(--brown-900)' : 'white', border: `1px solid ${birthdaySoon && !isSelected ? 'var(--gold)' : isSelected ? 'var(--brown-900)' : 'var(--brown-100)'}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                      style={{ background: isSelected ? 'var(--gold)' : 'var(--cream)', color: isSelected ? 'var(--brown-900)' : 'var(--brown-700)' }}>
                      {person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: isSelected ? 'var(--cream)' : 'var(--brown-900)' }}>{person.name}</p>
                      <p className="text-xs" style={{ color: isSelected ? 'var(--brown-300)' : 'var(--brown-500)' }}>{person.relationship}</p>
                    </div>
                    {birthdaySoon && <span className="text-base flex-shrink-0">🎂</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-serif text-2xl mb-1" style={{ color: 'var(--brown-900)' }}>{selected.name}</h2>
                    {selected.relationship && <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-700)' }}>{selected.relationship}</span>}
                  </div>
                  <button onClick={() => deletePerson(selected.id)} className="text-sm" style={{ color: 'var(--brown-300)' }}>Remove</button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { label: 'Contact', value: selected.contact },
                    { label: 'Location', value: selected.location },
                    { label: 'Birthday', value: selected.birthday },
                    { label: 'Last Contact', value: selected.last_contact },
                  ].filter(f => f.value).map(field => (
                    <div key={field.label}>
                      <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--brown-300)' }}>{field.label}</p>
                      <p className="text-sm" style={{ color: 'var(--brown-700)' }}>{field.value}</p>
                    </div>
                  ))}
                </div>

                {[
                  { label: 'How We Met', value: selected.how_we_met },
                  { label: 'Why They Matter', value: selected.why_important },
                  { label: 'Notes', value: selected.notes },
                ].filter(s => s.value).map(section => (
                  <div key={section.label} className="mb-4 p-4 rounded-xl" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--brown-500)' }}>{section.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-700)' }}>{section.value}</p>
                  </div>
                ))}
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm" style={{ color: 'var(--brown-300)' }}>Select someone to view their profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Person" width="max-w-xl">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Relationship" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} options={RELATIONSHIP_TYPES} />
            <Input label="Birthday" type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone, email..." />
            <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, state..." />
          </div>
          <Textarea label="How We Met" value={form.how_we_met} onChange={e => setForm(f => ({ ...f, how_we_met: e.target.value }))} rows={2} />
          <Textarea label="Why They Matter" value={form.why_important} onChange={e => setForm(f => ({ ...f, why_important: e.target.value }))} rows={2} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Person'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
