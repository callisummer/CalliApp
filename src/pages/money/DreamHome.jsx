import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Outdoor', 'Entryway', 'Dining Room', 'Other']
const STATUSES = ['dream', 'saving', 'purchased']

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

export default function DreamHome({ session }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [roomFilter, setRoomFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', room: '', description: '', image_url: '', vibe: '', status: 'dream', budget: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('dream_home').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('dream_home').insert({
      user_id: session.user.id,
      ...form,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setForm({ title: '', room: '', description: '', image_url: '', vibe: '', status: 'dream', budget: '', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('dream_home').update({ status }).eq('id', id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function deleteItem(id) {
    await supabase.from('dream_home').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = roomFilter === 'All' ? items : items.filter(i => i.room === roomFilter)
  const rooms = ['All', ...ROOMS.filter(r => items.some(i => i.room === r))]

  return (
    <div>
      <SectionHeader title="Dream Home" subtitle="Visualize and create your sanctuary">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Item</Button>
      </SectionHeader>

      {/* Room filter */}
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {rooms.map(room => (
            <button
              key={room}
              onClick={() => setRoomFilter(room)}
              className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                background: roomFilter === room ? 'var(--brown-900)' : 'white',
                color: roomFilter === room ? 'var(--cream)' : 'var(--brown-500)',
                border: '1px solid var(--brown-100)',
              }}
            >
              {room}
            </button>
          ))}
        </div>
      )}

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        filtered.length === 0 ? (
          <EmptyState
            icon="🏡"
            title="Your dream home awaits"
            description="Add furniture, decor, and design inspiration to build your vision."
            action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Item</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <Card key={item.id} className="overflow-hidden" goldHover>
                {item.image_url && (
                  <div className="aspect-video overflow-hidden" style={{ background: 'var(--cream-dark)' }}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={e => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                {!item.image_url && (
                  <div className="aspect-video flex items-center justify-center text-4xl" style={{ background: 'var(--cream-dark)' }}>
                    🏡
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm" style={{ color: 'var(--brown-900)' }}>{item.title}</h3>
                    <Badge status={item.status} />
                  </div>
                  {item.room && <p className="text-xs mb-1" style={{ color: 'var(--brown-500)' }}>{item.room}</p>}
                  {item.vibe && <p className="text-xs italic mb-2" style={{ color: 'var(--brown-500)' }}>"{item.vibe}"</p>}
                  {item.description && <p className="text-xs mb-3" style={{ color: 'var(--brown-700)' }}>{item.description}</p>}
                  {item.budget && <p className="text-sm font-medium mb-3" style={{ color: 'var(--gold-dark)' }}>{fmt(item.budget)}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(item.id, s)}
                        className="px-2 py-0.5 rounded text-xs capitalize transition-all"
                        style={{
                          background: item.status === s ? 'var(--gold)' : 'var(--cream)',
                          color: item.status === s ? 'var(--brown-900)' : 'var(--brown-500)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                    <button onClick={() => deleteItem(item.id)} className="ml-auto text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add to Dream Home">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Linen sofa, marble counters..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Room" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} options={ROOMS} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
          </div>
          <Input label="Vibe / Aesthetic" value={form.vibe} onChange={e => setForm(f => ({ ...f, vibe: e.target.value }))} placeholder="Warm minimal, Japandi, boho luxe..." />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Input label="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
          <Input label="Budget" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="2500" />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
