import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Tabs, Modal, Badge, EmptyState, Spinner, StarRating } from '../../components/ui'

const TYPES = ['book', 'course', 'podcast', 'certification', 'article', 'other']
const STATUSES = ['want', 'reading', 'completed', 'paused']
const CATEGORIES = ['Healing & Spirituality', 'Plant Medicine', 'Coaching', 'Business', 'Finance', 'Self-Help', 'Health', 'Hair & Beauty', 'Creativity', 'Biography', 'Other']

const TYPE_ICONS = {
  book: '📚', course: '🎓', podcast: '🎙️', certification: '🏆', article: '📄', other: '✦'
}

const STATUS_LABELS = { want: 'Want to Learn', reading: 'In Progress', completed: 'Completed', paused: 'Paused' }

export default function Library({ session }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ title: '', author: '', type: 'book', category: '', status: 'want', rating: 0, notes: '', key_lessons: '', link: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('library_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('library_items').insert({
      user_id: session.user.id,
      ...form,
      rating: form.rating || null,
    }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setForm({ title: '', author: '', type: 'book', category: '', status: 'want', rating: 0, notes: '', key_lessons: '', link: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('library_items').update({ status }).eq('id', id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function deleteItem(id) {
    await supabase.from('library_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (expanded?.id === id) setExpanded(null)
  }

  const filtered = items.filter(i => {
    const typeMatch = typeFilter === 'All' || i.type === typeFilter
    const statMatch = statusFilter === 'All' || i.status === statusFilter
    return typeMatch && statMatch
  })

  const tabs = [{ label: 'All', value: 'All' }, ...TYPES.map(t => ({ label: `${TYPE_ICONS[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}s`, value: t }))]

  return (
    <div>
      <SectionHeader title="Library" subtitle="Books, courses, and wisdom that shapes you">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Item</Button>
      </SectionHeader>

      <div className="flex gap-2 flex-wrap mb-4">
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
            style={{
              background: statusFilter === s ? 'var(--brown-900)' : 'white',
              color: statusFilter === s ? 'var(--cream)' : 'var(--brown-500)',
              border: '1px solid var(--brown-100)',
            }}
          >
            {s === 'All' ? 'All Status' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Tabs tabs={tabs} active={typeFilter} onChange={setTypeFilter} />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        filtered.length === 0 ? (
          <EmptyState icon="📚" title="Nothing here yet" description="Add books, courses, and resources you want to learn from." action={<Button onClick={() => setShowModal(true)} variant="gold">Add to Library</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <Card key={item.id} className="p-4 cursor-pointer" goldHover onClick={() => setExpanded(expanded?.id === item.id ? null : item)}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{TYPE_ICONS[item.type] || '✦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug" style={{ color: 'var(--brown-900)' }}>{item.title}</h3>
                      <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} className="text-xs flex-shrink-0" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                    {item.author && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{item.author}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge status={item.status} label={STATUS_LABELS[item.status]} />
                      {item.category && <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{item.category}</span>}
                    </div>
                    {item.rating > 0 && (
                      <div className="flex gap-0.5 mt-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className="text-xs" style={{ color: i < item.rating ? 'var(--gold)' : 'var(--brown-100)' }}>★</span>
                        ))}
                      </div>
                    )}

                    {expanded?.id === item.id && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--brown-100)' }}>
                        {item.notes && (
                          <div className="mb-2">
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--brown-500)' }}>Notes</p>
                            <p className="text-xs" style={{ color: 'var(--brown-700)' }}>{item.notes}</p>
                          </div>
                        )}
                        {item.key_lessons && (
                          <div className="mb-2">
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--brown-500)' }}>Key Lessons</p>
                            <p className="text-xs" style={{ color: 'var(--brown-700)' }}>{item.key_lessons}</p>
                          </div>
                        )}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--gold-dark)' }} onClick={e => e.stopPropagation()}>
                            View Resource →
                          </a>
                        )}
                        <div className="flex gap-1 flex-wrap mt-2">
                          {STATUSES.filter(s => s !== item.status).map(s => (
                            <button
                              key={s}
                              onClick={e => { e.stopPropagation(); updateStatus(item.id, s) }}
                              className="text-xs px-2 py-0.5 rounded transition-all capitalize"
                              style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}
                            >
                              → {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add to Library" width="max-w-lg">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Book / course / podcast name..." />
          <Input label="Author / Creator" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author, teacher, host..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPES} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
          </div>
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} />
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>Rating</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Your thoughts..." />
          <Textarea label="Key Lessons" value={form.key_lessons} onChange={e => setForm(f => ({ ...f, key_lessons: e.target.value }))} rows={2} placeholder="What you learned..." />
          <Input label="Link" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add to Library'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
