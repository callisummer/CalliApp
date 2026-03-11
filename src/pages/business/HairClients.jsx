import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const HAIR_TYPES = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C']
const TEXTURES = ['Fine', 'Medium', 'Coarse']

function daysBetween(d1, d2) {
  return Math.floor((new Date(d1) - new Date(d2)) / 86400000)
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function HairClients({ session }) {
  const [clients, setClients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddAppt, setShowAddAppt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', birthday: '', hair_type: '', hair_texture: '', allergies: '', color_formula: '', notes: '', referred_by: '' })
  const [apptForm, setApptForm] = useState({ date: '', service: '', price: '', duration_min: '', color_used: '', notes: '', status: 'scheduled' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('hair_clients').select('*').eq('user_id', session.user.id).eq('is_active', true).order('name'),
      supabase.from('appointments').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
    ])
    setClients(c || [])
    setAppointments(a || [])
    setLoading(false)
  }

  async function addClient() {
    if (!clientForm.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('hair_clients').insert({ user_id: session.user.id, ...clientForm, birthday: clientForm.birthday || null }).select().single()
    if (data) setClients(prev => [...prev, data])
    setClientForm({ name: '', phone: '', email: '', birthday: '', hair_type: '', hair_texture: '', allergies: '', color_formula: '', notes: '', referred_by: '' })
    setShowAddClient(false)
    setSaving(false)
  }

  async function addAppointment() {
    if (!apptForm.date || !selectedClient) return
    setSaving(true)
    const { data } = await supabase.from('appointments').insert({
      user_id: session.user.id,
      client_id: selectedClient.id,
      client_name: selectedClient.name,
      ...apptForm,
      price: apptForm.price ? parseFloat(apptForm.price) : null,
      duration_min: apptForm.duration_min ? parseInt(apptForm.duration_min) : null,
    }).select().single()
    if (data) setAppointments(prev => [data, ...prev])
    setApptForm({ date: '', service: '', price: '', duration_min: '', color_used: '', notes: '', status: 'scheduled' })
    setShowAddAppt(false)
    setSaving(false)
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))

  function getLastAppt(clientId) {
    return appointments.filter(a => a.client_id === clientId).sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  }

  function getClientAppts(clientId) {
    return appointments.filter(a => a.client_id === clientId).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return (
    <div>
      <SectionHeader title="Hair Clients" subtitle="Your beautiful client family">
        <Button onClick={() => setShowAddClient(true)} variant="gold">+ Add Client</Button>
      </SectionHeader>

      {/* Search */}
      <div className="mb-6">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients by name or phone..." />
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client list */}
          <div className="lg:col-span-1 space-y-2">
            {filtered.length === 0 ? (
              <EmptyState icon="💇🏽‍♀️" title="No clients yet" description="Add your first client to get started." action={<Button onClick={() => setShowAddClient(true)} variant="gold">Add Client</Button>} />
            ) : filtered.map(client => {
              const lastAppt = getLastAppt(client.id)
              const isSelected = selectedClient?.id === client.id
              const daysSince = lastAppt ? daysBetween(new Date(), new Date(lastAppt.date)) : null
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(isSelected ? null : client)}
                  className="p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: isSelected ? 'var(--brown-900)' : 'white',
                    border: `1px solid ${isSelected ? 'var(--brown-900)' : 'var(--brown-100)'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                      style={{ background: isSelected ? 'var(--gold)' : 'var(--cream)', color: isSelected ? 'var(--brown-900)' : 'var(--brown-700)' }}
                    >
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: isSelected ? 'var(--cream)' : 'var(--brown-900)' }}>{client.name}</p>
                      {lastAppt ? (
                        <p className="text-xs" style={{ color: isSelected ? 'var(--brown-300)' : 'var(--brown-500)' }}>Last: {daysSince === 0 ? 'Today' : `${daysSince}d ago`}</p>
                      ) : (
                        <p className="text-xs" style={{ color: isSelected ? 'var(--brown-300)' : 'var(--brown-300)' }}>New client</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Client profile */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-serif text-2xl" style={{ color: 'var(--brown-900)' }}>{selectedClient.name}</h2>
                    {selectedClient.phone && <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{selectedClient.phone}</p>}
                    {selectedClient.email && <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{selectedClient.email}</p>}
                  </div>
                  <Button onClick={() => { setShowAddAppt(true) }} variant="gold" size="sm">+ Appointment</Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { label: 'Birthday', value: selectedClient.birthday ? formatDate(selectedClient.birthday) : null },
                    { label: 'Referred By', value: selectedClient.referred_by },
                    { label: 'Hair Type', value: selectedClient.hair_type },
                    { label: 'Texture', value: selectedClient.hair_texture },
                  ].filter(f => f.value).map(field => (
                    <div key={field.label}>
                      <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--brown-300)' }}>{field.label}</p>
                      <p className="text-sm" style={{ color: 'var(--brown-700)' }}>{field.value}</p>
                    </div>
                  ))}
                </div>

                {selectedClient.allergies && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: '#FEE2E2' }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: '#991B1B' }}>Allergies / Sensitivities</p>
                    <p className="text-sm" style={{ color: '#991B1B' }}>{selectedClient.allergies}</p>
                  </div>
                )}

                {selectedClient.color_formula && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--brown-500)' }}>Color Formula</p>
                    <p className="text-sm" style={{ color: 'var(--brown-700)' }}>{selectedClient.color_formula}</p>
                  </div>
                )}

                {selectedClient.notes && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--brown-500)' }}>Notes</p>
                    <p className="text-sm" style={{ color: 'var(--brown-700)' }}>{selectedClient.notes}</p>
                  </div>
                )}

                {/* Appointment history */}
                <div>
                  <h3 className="font-serif text-base mb-3" style={{ color: 'var(--brown-900)' }}>Appointment History</h3>
                  {getClientAppts(selectedClient.id).length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--brown-300)' }}>No appointments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {getClientAppts(selectedClient.id).map(appt => (
                        <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{appt.service || 'Appointment'}</span>
                              <Badge status={appt.status} />
                            </div>
                            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{new Date(appt.date).toLocaleDateString()}</p>
                            {appt.color_used && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Color: {appt.color_used}</p>}
                          </div>
                          {appt.price && <span className="text-sm font-medium" style={{ color: 'var(--gold-dark)' }}>${appt.price}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm" style={{ color: 'var(--brown-300)' }}>Select a client to view their profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Modal isOpen={showAddClient} onClose={() => setShowAddClient(false)} title="Add New Client" width="max-w-2xl">
        <div className="space-y-4">
          <Input label="Full Name" value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
            <Input label="Email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="email@example.com" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Birthday" value={clientForm.birthday} onChange={e => setClientForm(f => ({ ...f, birthday: e.target.value }))} type="date" />
            <Select label="Hair Type" value={clientForm.hair_type} onChange={e => setClientForm(f => ({ ...f, hair_type: e.target.value }))} options={HAIR_TYPES} />
            <Select label="Texture" value={clientForm.hair_texture} onChange={e => setClientForm(f => ({ ...f, hair_texture: e.target.value }))} options={TEXTURES} />
          </div>
          <Input label="Allergies / Sensitivities" value={clientForm.allergies} onChange={e => setClientForm(f => ({ ...f, allergies: e.target.value }))} placeholder="Any known allergies..." />
          <Textarea label="Color Formula" value={clientForm.color_formula} onChange={e => setClientForm(f => ({ ...f, color_formula: e.target.value }))} placeholder="Formula notes..." rows={2} />
          <Input label="Referred By" value={clientForm.referred_by} onChange={e => setClientForm(f => ({ ...f, referred_by: e.target.value }))} placeholder="How did they find you?" />
          <Textarea label="Notes" value={clientForm.notes} onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))} placeholder="General notes..." rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowAddClient(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={addClient} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Client'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal isOpen={showAddAppt} onClose={() => setShowAddAppt(false)} title={`Add Appointment — ${selectedClient?.name}`}>
        <div className="space-y-4">
          <Input label="Date & Time" value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} type="datetime-local" />
          <Input label="Service" value={apptForm.service} onChange={e => setApptForm(f => ({ ...f, service: e.target.value }))} placeholder="Balayage, cut, color..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" value={apptForm.price} onChange={e => setApptForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
            <Input label="Duration (min)" type="number" value={apptForm.duration_min} onChange={e => setApptForm(f => ({ ...f, duration_min: e.target.value }))} placeholder="120" />
          </div>
          <Input label="Color Used" value={apptForm.color_used} onChange={e => setApptForm(f => ({ ...f, color_used: e.target.value }))} placeholder="Color formula used..." />
          <Select label="Status" value={apptForm.status} onChange={e => setApptForm(f => ({ ...f, status: e.target.value }))} options={['scheduled', 'completed', 'cancelled', 'no-show']} />
          <Textarea label="Notes" value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowAddAppt(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={addAppointment} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Appointment'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
