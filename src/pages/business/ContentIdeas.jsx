import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Podcast', 'Blog', 'Email', 'All Platforms']
const CONTENT_TYPES = ['Reel / Short', 'Carousel', 'Photo', 'Story', 'Long-form Video', 'Podcast Episode', 'Blog Post', 'Email Newsletter', 'Live']
const STATUSES = ['idea', 'scripted', 'filmed', 'published']

const PLATFORM_COLORS = {
  Instagram: { bg: '#FCE7F3', color: '#9D174D' },
  TikTok: { bg: '#1A1A2E', color: '#F0F0F0' },
  YouTube: { bg: '#FEE2E2', color: '#991B1B' },
  Podcast: { bg: '#EDE9FE', color: '#5B21B6' },
  Blog: { bg: '#DBEAFE', color: '#1E40AF' },
  Email: { bg: '#D1FAE5', color: '#065F46' },
  'All Platforms': { bg: '#FEF3C7', color: '#92400E' },
}

const STATUS_ORDER = ['idea', 'scripted', 'filmed', 'published']

export default function ContentIdeas({ session }) {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', platform: '', content_type: '', status: 'idea', scheduled_date: '', tags: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('content_ideas').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('content_ideas').insert({
      user_id: session.user.id,
      title: form.title,
      description: form.description,
      platform: form.platform,
      content_type: form.content_type,
      status: form.status,
      scheduled_date: form.scheduled_date || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }).select().single()
    if (data) setIdeas(prev => [data, ...prev])
    setForm({ title: '', description: '', platform: '', content_type: '', status: 'idea', scheduled_date: '', tags: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateStatus(id, status) {
    const { data } = await supabase.from('content_ideas').update({ status }).eq('id', id).select().single()
    if (data) setIdeas(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function deleteIdea(id) {
    await supabase.from('content_ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const filtered = ideas.filter(i => {
    const platMatch = platformFilter === 'All' || i.platform === platformFilter
    const statMatch = statusFilter === 'All' || i.status === statusFilter
    return platMatch && statMatch
  })

  const platforms = ['All', ...PLATFORMS.filter(p => ideas.some(i => i.platform === p))]

  return (
    <div>
      <SectionHeader title="Content Ideas" subtitle="Your creative content pipeline">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add Idea</Button>
      </SectionHeader>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6">
        <div className="flex gap-1 flex-wrap">
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
              {s === 'All' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {/* Kanban-style layout */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(status => {
              const statusIdeas = (statusFilter === 'All' ? ideas : ideas.filter(i => i.status === statusFilter))
                .filter(i => i.status === status)
                .filter(i => platformFilter === 'All' || i.platform === platformFilter)
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: status === 'idea' ? '#8B5CF6' : status === 'scripted' ? '#F59E0B' : status === 'filmed' ? '#EF4444' : '#10B981' }} />
                    <span className="text-xs uppercase tracking-widest font-medium capitalize" style={{ color: 'var(--brown-700)' }}>{status}</span>
                    <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{statusIdeas.length}</span>
                  </div>
                  <div className="space-y-3">
                    {statusIdeas.map(idea => {
                      const platColors = PLATFORM_COLORS[idea.platform] || { bg: 'var(--cream)', color: 'var(--brown-500)' }
                      return (
                        <Card key={idea.id} className="p-4" goldHover>
                          {idea.platform && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                              style={{ background: platColors.bg, color: platColors.color }}
                            >
                              {idea.platform}
                            </span>
                          )}
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--brown-900)' }}>{idea.title}</p>
                          {idea.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--brown-500)' }}>{idea.description}</p>}
                          {idea.content_type && <p className="text-xs mb-2" style={{ color: 'var(--brown-300)' }}>{idea.content_type}</p>}
                          {idea.scheduled_date && <p className="text-xs mb-2" style={{ color: 'var(--gold-dark)' }}>📅 {idea.scheduled_date}</p>}
                          <div className="flex gap-1 flex-wrap mt-2">
                            {STATUS_ORDER.filter(s => s !== status).map(s => (
                              <button
                                key={s}
                                onClick={() => updateStatus(idea.id, s)}
                                className="text-xs px-2 py-0.5 rounded transition-all capitalize"
                                style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}
                              >
                                → {s}
                              </button>
                            ))}
                            <button onClick={() => deleteIdea(idea.id)} className="text-xs ml-auto" style={{ color: 'var(--brown-300)' }}>✕</button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {ideas.length === 0 && (
            <EmptyState icon="✨" title="Your content pipeline is empty" description="Start capturing ideas and watch your content come to life." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Your First Idea</Button>} />
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Content Idea">
        <div className="space-y-4">
          <Input label="Title / Hook" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="5 things I wish I knew before my natural hair journey..." />
          <Textarea label="Description / Script Notes" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details, talking points, structure..." rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Platform" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} options={PLATFORMS} />
            <Select label="Content Type" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))} options={CONTENT_TYPES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
            <Input label="Scheduled Date" type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
          </div>
          <Input label="Tags (comma separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="natural hair, healing, mindset..." />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Idea'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
