import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Tabs, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

const PROJECT_TYPES = ['Music', 'Writing', 'Art', 'Photography', 'Video', 'Fashion', 'Dance', 'Podcast', 'Other']
const PROJECT_STATUSES = ['idea', 'in-progress', 'complete', 'on-hold']
const INSPIRATION_TYPES = ['book', 'music', 'movie', 'art', 'person', 'quote', 'other']

export default function CreativeLife({ session }) {
  const [tab, setTab] = useState('Projects')
  const [projects, setProjects] = useState([])
  const [inspiration, setInspiration] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projectForm, setProjectForm] = useState({ title: '', type: '', description: '', inspiration: '', status: 'idea', started_at: '', notes: '' })
  const [inspForm, setInspForm] = useState({ title: '', creator: '', type: 'music', why: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from('creative_projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('inspiration').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    ])
    setProjects(p || [])
    setInspiration(i || [])
    setLoading(false)
  }

  async function addProject() {
    if (!projectForm.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('creative_projects').insert({ user_id: session.user.id, ...projectForm, started_at: projectForm.started_at || null }).select().single()
    if (data) setProjects(prev => [data, ...prev])
    setProjectForm({ title: '', type: '', description: '', inspiration: '', status: 'idea', started_at: '', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function addInspiration() {
    if (!inspForm.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('inspiration').insert({ user_id: session.user.id, ...inspForm }).select().single()
    if (data) setInspiration(prev => [data, ...prev])
    setInspForm({ title: '', creator: '', type: 'music', why: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function updateProjectStatus(id, status) {
    const { data } = await supabase.from('creative_projects').update({ status }).eq('id', id).select().single()
    if (data) setProjects(prev => prev.map(p => p.id === data.id ? data : p))
  }

  async function deleteProject(id) {
    await supabase.from('creative_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function deleteInspiration(id) {
    await supabase.from('inspiration').delete().eq('id', id)
    setInspiration(prev => prev.filter(i => i.id !== id))
  }

  const TYPE_ICONS = { book: '📚', music: '🎵', movie: '🎬', art: '🎨', person: '✨', quote: '💬', other: '✦' }
  const PROJECT_STATUS_COLORS = { idea: '#EDE9FE', 'in-progress': '#FEF3C7', complete: '#D1FAE5', 'on-hold': '#F3F4F6' }

  return (
    <div>
      <SectionHeader title="Creative Life" subtitle="Your art, your expression, your soul's work">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add {tab === 'Projects' ? 'Project' : 'Inspiration'}</Button>
      </SectionHeader>

      <Tabs tabs={['Projects', 'Inspiration Board']} active={tab} onChange={setTab} />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {tab === 'Projects' && (
            projects.length === 0 ? (
              <EmptyState icon="🎨" title="No creative projects yet" description="Track your creative work — music, writing, art, and more." action={<Button onClick={() => setShowModal(true)} variant="gold">Start a Project</Button>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map(project => (
                  <Card key={project.id} className="p-5" goldHover>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {project.type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: PROJECT_STATUS_COLORS[project.status] || '#F3F4F6', color: 'var(--brown-700)' }}>{project.type}</span>}
                          <Badge status={project.status} />
                        </div>
                        <h3 className="font-serif text-base font-medium" style={{ color: 'var(--brown-900)' }}>{project.title}</h3>
                      </div>
                      <button onClick={() => deleteProject(project.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                    {project.description && <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--brown-700)' }}>{project.description}</p>}
                    {project.inspiration && (
                      <div className="p-2.5 rounded-lg mb-3" style={{ background: 'var(--cream)' }}>
                        <p className="text-xs italic" style={{ color: 'var(--brown-500)' }}>Inspired by: {project.inspiration}</p>
                      </div>
                    )}
                    {project.started_at && <p className="text-xs mb-3" style={{ color: 'var(--brown-500)' }}>Started: {project.started_at}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {PROJECT_STATUSES.filter(s => s !== project.status).map(s => (
                        <button key={s} onClick={() => updateProjectStatus(project.id, s)} className="text-xs px-2 py-0.5 rounded capitalize transition-all" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>
                          → {s}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {tab === 'Inspiration Board' && (
            inspiration.length === 0 ? (
              <EmptyState icon="✨" title="Nothing here yet" description="Collect the art, music, people, and ideas that light you up." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Inspiration</Button>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspiration.map(item => (
                  <Card key={item.id} className="p-4" goldHover>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{TYPE_ICONS[item.type] || '✦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{item.title}</h3>
                          <button onClick={() => deleteInspiration(item.id)} className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>✕</button>
                        </div>
                        {item.creator && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{item.creator}</p>}
                        {item.why && <p className="text-xs mt-2 italic" style={{ color: 'var(--brown-700)' }}>{item.why}</p>}
                        <span className="text-xs capitalize mt-2 inline-block px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>{item.type}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'Projects' ? 'New Creative Project' : 'Add Inspiration'}>
        {tab === 'Projects' ? (
          <div className="space-y-4">
            <Input label="Project Title" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} placeholder="What are you creating?" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type" value={projectForm.type} onChange={e => setProjectForm(f => ({ ...f, type: e.target.value }))} options={PROJECT_TYPES} />
              <Select label="Status" value={projectForm.status} onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))} options={PROJECT_STATUSES} />
            </div>
            <Textarea label="Description" value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            <Input label="Inspired By" value={projectForm.inspiration} onChange={e => setProjectForm(f => ({ ...f, inspiration: e.target.value }))} />
            <Input label="Start Date" type="date" value={projectForm.started_at} onChange={e => setProjectForm(f => ({ ...f, started_at: e.target.value }))} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addProject} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Project'}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Title" value={inspForm.title} onChange={e => setInspForm(f => ({ ...f, title: e.target.value }))} placeholder="Song name, book title, artist..." />
            <Input label="Creator / Artist / Source" value={inspForm.creator} onChange={e => setInspForm(f => ({ ...f, creator: e.target.value }))} />
            <Select label="Type" value={inspForm.type} onChange={e => setInspForm(f => ({ ...f, type: e.target.value }))} options={INSPIRATION_TYPES} />
            <Textarea label="Why This Inspires Me" value={inspForm.why} onChange={e => setInspForm(f => ({ ...f, why: e.target.value }))} rows={3} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addInspiration} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
