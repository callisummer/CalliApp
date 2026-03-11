import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const TRAVEL_TYPES = ['Adventure', 'Spiritual', 'Beach', 'Cultural', 'Retreat', 'Healing', 'City', 'Nature', 'Other']
const STATUSES = ['dream', 'planning', 'booked', 'visited']

const STATUS_LABELS = { dream: '✦ Dreaming', planning: '📋 Planning', booked: '✈️ Booked', visited: '✓ Been there' }

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

export default function Travel({ session }) {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ destination: '', country: '', type: '', description: '', why: '', budget: '', ideal_time: '', status: 'dream', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('travel_wishlist').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setDestinations(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.destination.trim()) return
    setSaving(true)
    const { data } = await supabase.from('travel_wishlist').insert({
      user_id: session.user.id,
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).select().single()
    if (data) setDestinations(prev => [data, ...prev])
    setForm({ destination: '', country: '', type: '', description: '', why: '', budget: '', ideal_time: '', status: 'dream', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const updates = { status }
    if (status === 'visited') updates.visited_at = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('travel_wishlist').update(updates).eq('id', id).select().single()
    if (data) setDestinations(prev => prev.map(d => d.id === data.id ? data : d))
  }

  async function deleteDestination(id) {
    await supabase.from('travel_wishlist').delete().eq('id', id)
    setDestinations(prev => prev.filter(d => d.id !== id))
  }

  const filtered = statusFilter === 'All' ? destinations : destinations.filter(d => d.status === statusFilter)
  const visited = destinations.filter(d => d.status === 'visited').length
  const totalBudget = destinations.filter(d => d.status !== 'visited' && d.budget).reduce((s, d) => s + Number(d.budget), 0)

  return (
    <div>
      <SectionHeader title="Travel & Bucket List" subtitle="Every destination your soul is calling you toward">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Destination</Button>
      </SectionHeader>

      {destinations.length > 0 && (
        <div className="flex items-center gap-6 mb-5 p-4 rounded-xl" style={{ background: 'white', border: '1px solid var(--brown-100)' }}>
          <div>
            <p className="font-serif text-xl" style={{ color: 'var(--brown-900)' }}>{visited}</p>
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Places visited</p>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--brown-100)' }} />
          <div>
            <p className="font-serif text-xl" style={{ color: 'var(--brown-900)' }}>{destinations.length - visited}</p>
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>On the list</p>
          </div>
          {totalBudget > 0 && (
            <>
              <div className="w-px h-8" style={{ background: 'var(--brown-100)' }} />
              <div>
                <p className="font-serif text-xl" style={{ color: 'var(--gold-dark)' }}>{fmt(totalBudget)}</p>
                <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Total travel budget</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{ background: statusFilter === s ? 'var(--brown-900)' : 'white', color: statusFilter === s ? 'var(--cream)' : 'var(--brown-500)', border: '1px solid var(--brown-100)' }}>
            {s === 'All' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        filtered.length === 0 ? (
          <EmptyState icon="✈️" title="Where will you go?" description="Add the destinations your soul is calling you toward." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Destination</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(dest => (
              <Card key={dest.id} className="p-5" goldHover style={dest.status === 'visited' ? { border: '2px solid var(--gold)' } : {}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {dest.status === 'visited' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'var(--gold)', color: 'var(--brown-900)' }}>✓ Been here</span>
                    )}
                    <h3 className="font-serif text-lg font-medium" style={{ color: 'var(--brown-900)' }}>{dest.destination}</h3>
                    {dest.country && <p className="text-sm" style={{ color: 'var(--brown-500)' }}>{dest.country}</p>}
                  </div>
                  <button onClick={() => deleteDestination(dest.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {dest.type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-700)' }}>{dest.type}</span>}
                  {dest.ideal_time && <span className="text-xs" style={{ color: 'var(--brown-500)' }}>Best: {dest.ideal_time}</span>}
                </div>

                {dest.description && <p className="text-sm mb-2" style={{ color: 'var(--brown-700)' }}>{dest.description}</p>}
                {dest.why && (
                  <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--cream)' }}>
                    <p className="text-xs italic" style={{ color: 'var(--brown-700)' }}>"{dest.why}"</p>
                  </div>
                )}
                {dest.budget && <p className="text-sm font-medium mb-3" style={{ color: 'var(--gold-dark)' }}>Budget: {fmt(dest.budget)}</p>}
                {dest.visited_at && <p className="text-xs mb-3" style={{ color: 'var(--brown-500)' }}>Visited: {dest.visited_at}</p>}

                <div className="flex gap-1 flex-wrap">
                  {STATUSES.filter(s => s !== dest.status).map(s => (
                    <button key={s} onClick={() => updateStatus(dest.id, s)} className="text-xs px-2 py-0.5 rounded capitalize transition-all" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Destination">
        <div className="space-y-4">
          <Input label="Destination" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Oaxaca, Bali, Sedona..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TRAVEL_TYPES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
            <Input label="Ideal Time to Visit" value={form.ideal_time} onChange={e => setForm(f => ({ ...f, ideal_time: e.target.value }))} placeholder="Spring, March..." />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What draws you there..." />
          <Input label="Why I Want to Go" value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} placeholder="My soul is calling me to..." />
          <Input label="Budget" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="3000" />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Destination'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
