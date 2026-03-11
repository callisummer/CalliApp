import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Tabs, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const EVENT_TYPES = ['Retreat', 'Workshop', 'Ceremony', 'Conference', 'Gathering', 'Training', 'Other']
const EVENT_STATUSES = ['wishlist', 'registered', 'attended', 'cancelled']

export default function Community({ session }) {
  const [tab, setTab] = useState('Events & Retreats')
  const [events, setEvents] = useState([])
  const [network, setNetwork] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eventForm, setEventForm] = useState({ title: '', type: '', date: '', location: '', description: '', cost: '', status: 'wishlist', notes: '' })
  const [networkForm, setNetworkForm] = useState({ name: '', type: '', specialty: '', contact: '', how_we_met: '', collab_ideas: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: e }, { data: n }] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
      supabase.from('network').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    ])
    setEvents(e || [])
    setNetwork(n || [])
    setLoading(false)
  }

  async function addEvent() {
    if (!eventForm.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('events').insert({ user_id: session.user.id, ...eventForm, cost: eventForm.cost ? parseFloat(eventForm.cost) : null, date: eventForm.date || null }).select().single()
    if (data) setEvents(prev => [data, ...prev])
    setEventForm({ title: '', type: '', date: '', location: '', description: '', cost: '', status: 'wishlist', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function addNetwork() {
    if (!networkForm.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('network').insert({ user_id: session.user.id, ...networkForm }).select().single()
    if (data) setNetwork(prev => [data, ...prev])
    setNetworkForm({ name: '', type: '', specialty: '', contact: '', how_we_met: '', collab_ideas: '', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateEventStatus(id, status) {
    const { data } = await supabase.from('events').update({ status }).eq('id', id).select().single()
    if (data) setEvents(prev => prev.map(e => e.id === data.id ? data : e))
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  async function deleteNetwork(id) {
    await supabase.from('network').delete().eq('id', id)
    setNetwork(prev => prev.filter(n => n.id !== id))
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
  }

  return (
    <div>
      <SectionHeader title="Community" subtitle="The circles, events, and collaborators that expand your world">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add {tab === 'Events & Retreats' ? 'Event' : 'Contact'}</Button>
      </SectionHeader>

      <Tabs tabs={['Events & Retreats', 'Network & Collaborators']} active={tab} onChange={setTab} />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {tab === 'Events & Retreats' && (
            events.length === 0 ? (
              <EmptyState icon="🌿" title="No events yet" description="Add retreats, workshops, ceremonies, and events you want to attend." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Event</Button>} />
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id} className="p-5" goldHover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {event.type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-700)' }}>{event.type}</span>}
                          <Badge status={event.status} />
                        </div>
                        <h3 className="font-serif text-base font-medium" style={{ color: 'var(--brown-900)' }}>{event.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs" style={{ color: 'var(--brown-500)' }}>
                          {event.date && <span>📅 {event.date}</span>}
                          {event.location && <span>📍 {event.location}</span>}
                          {event.cost && <span>💰 {fmt(event.cost)}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(event.id)} className="text-xs ml-2" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                    {event.description && <p className="text-sm mb-3" style={{ color: 'var(--brown-700)' }}>{event.description}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {EVENT_STATUSES.filter(s => s !== event.status).map(s => (
                        <button key={s} onClick={() => updateEventStatus(event.id, s)} className="text-xs px-2 py-0.5 rounded capitalize transition-all" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>
                          → {s}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === 'Network & Collaborators' && (
            network.length === 0 ? (
              <EmptyState icon="🤝" title="No network contacts yet" description="Add collaborators, peers, and community connections." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Contact</Button>} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {network.map(person => (
                  <Card key={person.id} className="p-5" goldHover>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium" style={{ color: 'var(--brown-900)' }}>{person.name}</h3>
                        {person.specialty && <p className="text-sm" style={{ color: 'var(--gold-dark)' }}>{person.specialty}</p>}
                        {person.type && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{person.type}</p>}
                      </div>
                      <button onClick={() => deleteNetwork(person.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                    {person.how_we_met && <p className="text-xs mb-2" style={{ color: 'var(--brown-500)' }}>Met: {person.how_we_met}</p>}
                    {person.collab_ideas && (
                      <div className="p-3 rounded-xl mb-2" style={{ background: 'var(--cream)' }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--brown-500)' }}>Collab Ideas</p>
                        <p className="text-xs" style={{ color: 'var(--brown-700)' }}>{person.collab_ideas}</p>
                      </div>
                    )}
                    {person.contact && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{person.contact}</p>}
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'Events & Retreats' ? 'Add Event or Retreat' : 'Add Network Contact'}>
        {tab === 'Events & Retreats' ? (
          <div className="space-y-4">
            <Input label="Event Name" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="Retreat name..." />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type" value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))} options={EVENT_TYPES} />
              <Select label="Status" value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value }))} options={EVENT_STATUSES} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} />
              <Input label="Cost" type="number" value={eventForm.cost} onChange={e => setEventForm(f => ({ ...f, cost: e.target.value }))} placeholder="2500" />
            </div>
            <Input label="Location" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} />
            <Textarea label="Description" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addEvent} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Event'}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Name" value={networkForm.name} onChange={e => setNetworkForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Type / Role" value={networkForm.type} onChange={e => setNetworkForm(f => ({ ...f, type: e.target.value }))} placeholder="Coach, healer, creator..." />
              <Input label="Specialty" value={networkForm.specialty} onChange={e => setNetworkForm(f => ({ ...f, specialty: e.target.value }))} />
            </div>
            <Input label="Contact" value={networkForm.contact} onChange={e => setNetworkForm(f => ({ ...f, contact: e.target.value }))} />
            <Input label="How We Met" value={networkForm.how_we_met} onChange={e => setNetworkForm(f => ({ ...f, how_we_met: e.target.value }))} />
            <Textarea label="Collab Ideas" value={networkForm.collab_ideas} onChange={e => setNetworkForm(f => ({ ...f, collab_ideas: e.target.value }))} rows={2} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addNetwork} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Contact'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
