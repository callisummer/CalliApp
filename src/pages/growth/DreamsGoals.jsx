import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const CATEGORIES = ['Career', 'Wealth', 'Relationships', 'Health', 'Spiritual', 'Travel', 'Creative', 'Home', 'Personal Growth', 'Impact', 'Other']
const STATUSES = ['dreaming', 'manifesting', 'achieved']

const CATEGORY_COLORS = {
  Career: '#1E40AF', Wealth: '#92400E', Relationships: '#9D174D', Health: '#065F46',
  Spiritual: '#5B21B6', Travel: '#0E7490', Creative: '#C2410C', Home: '#713F12',
  'Personal Growth': '#3730A3', Impact: '#065F46', Other: '#6B7280',
}

export default function DreamsGoals({ session }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: '', affirmation: '', status: 'dreaming', image_url: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('vision_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('vision_items').insert({ user_id: session.user.id, ...form }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setForm({ title: '', description: '', category: '', affirmation: '', status: 'dreaming', image_url: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('vision_items').update({ status }).eq('id', id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function deleteItem(id) {
    await supabase.from('vision_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter)
  const achieved = items.filter(i => i.status === 'achieved').length

  return (
    <div>
      <SectionHeader title="Dreams & Goals" subtitle="Your vision board — everything you're calling in">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Dream</Button>
      </SectionHeader>

      {items.length > 0 && (
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: 'white', border: '1px solid var(--brown-100)' }}>
          <span className="text-2xl">✦</span>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--brown-900)' }}>{achieved} dream{achieved !== 1 ? 's' : ''} achieved</p>
            <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Keep going — your future self is cheering you on</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-sm capitalize transition-all"
            style={{
              background: filter === s ? 'var(--brown-900)' : 'white',
              color: filter === s ? 'var(--cream)' : 'var(--brown-500)',
              border: '1px solid var(--brown-100)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        filtered.length === 0 ? (
          <EmptyState icon="🌟" title="Dream big" description="Add your dreams, desires, and goals — and watch them come to life." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Dream</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => {
              const catColor = CATEGORY_COLORS[item.category] || '#6B7280'
              const isAchieved = item.status === 'achieved'
              return (
                <Card
                  key={item.id}
                  className="p-5 overflow-hidden"
                  goldHover
                  style={isAchieved ? { border: '2px solid var(--gold)' } : {}}
                >
                  {item.image_url && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 -mx-5 -mt-5">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                    </div>
                  )}

                  {isAchieved && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: '#FEF9C3' }}>
                      <span>🎉</span>
                      <span className="text-xs font-medium" style={{ color: '#713F12' }}>Dream Achieved!</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {item.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                          style={{ background: `${catColor}15`, color: catColor }}
                        >
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-serif text-base font-medium" style={{ color: 'var(--brown-900)' }}>{item.title}</h3>
                    </div>
                    <button onClick={() => deleteItem(item.id)} className="text-xs ml-2" style={{ color: 'var(--brown-300)' }}>✕</button>
                  </div>

                  {item.description && <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--brown-700)' }}>{item.description}</p>}

                  {item.affirmation && (
                    <div className="p-3 rounded-xl mb-3" style={{ background: 'var(--cream)' }}>
                      <p className="text-xs italic" style={{ color: 'var(--gold-dark)' }}>"{item.affirmation}"</p>
                    </div>
                  )}

                  <div className="flex gap-1 flex-wrap">
                    {STATUSES.filter(s => s !== item.status).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(item.id, s)}
                        className="text-xs px-2 py-0.5 rounded capitalize transition-all"
                        style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}
                      >
                        {s === 'achieved' ? '✓ Achieved' : `→ ${s}`}
                      </button>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add a Dream or Goal">
        <div className="space-y-4">
          <Input label="What do you dream of?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="My dream, desire, or goal..." />
          <Textarea label="Describe it" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does it look like? How does it feel?" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
          </div>
          <Input label="Affirmation" value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))} placeholder="I am... I have... I live in..." />
          <Input label="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Dream'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
