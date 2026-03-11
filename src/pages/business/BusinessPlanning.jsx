import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Tabs, Modal, Badge, EmptyState, Spinner, SaveButton, ProgressBar } from '../../components/ui'

const TABS = [
  { label: 'Coaching Biz', value: 'coaching' },
  { label: 'Brand Identity', value: 'brand' },
  { label: 'Mission & Values', value: 'mission' },
  { label: 'Launch Checklist', value: 'launch' },
]

const DEFAULT_ITEMS = {
  coaching: [
    'Define my niche and ideal coaching client',
    'Develop my signature coaching offer',
    'Set my coaching rates',
    'Create intake & discovery call process',
    'Build out client portal or tools',
    'Establish coaching agreements/contracts',
    'Define session structure and packages',
  ],
  brand: [
    'Write my brand story',
    'Define brand values',
    'Create brand mood board',
    'Choose brand colors and fonts',
    'Design logo or hire designer',
    'Develop brand voice guidelines',
    'Create professional headshots',
  ],
  mission: [
    'Write personal mission statement',
    'Define the impact I want to have',
    'Clarify my legacy vision',
    'Document my core values',
    'Write my "why" statement',
  ],
  launch: [
    'Set launch date',
    'Build website or landing page',
    'Set up booking system',
    'Create social media profiles',
    'Launch email list',
    'Create free resource or lead magnet',
    'Plan launch content calendar',
    'Set up payment processing',
    'Announce to existing network',
  ],
}

export default function BusinessPlanning({ session }) {
  const [tab, setTab] = useState('coaching')
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => { load() }, [session.user.id])

  async function load() {
    setLoading(true)
    const [{ data: bItems }, { data: noteData }] = await Promise.all([
      supabase.from('business_items').select('*').eq('user_id', session.user.id).in('section', ['coaching', 'brand', 'mission', 'launch']).order('sort_order'),
      supabase.from('user_content').select('content').eq('user_id', session.user.id).eq('key', 'business_planning_notes').maybeSingle(),
    ])

    let existingItems = bItems || []

    // Seed default items if none exist
    if (existingItems.length === 0) {
      const defaults = Object.entries(DEFAULT_ITEMS).flatMap(([section, titles]) =>
        titles.map((title, i) => ({ user_id: session.user.id, section, title, status: 'todo', sort_order: i }))
      )
      const { data: inserted } = await supabase.from('business_items').insert(defaults).select()
      existingItems = inserted || []
    }

    setItems(existingItems)
    setNotes(noteData?.content || '')
    setLoading(false)
  }

  async function toggleStatus(item) {
    const next = item.status === 'todo' ? 'in_progress' : item.status === 'in_progress' ? 'done' : 'todo'
    const { data } = await supabase.from('business_items').update({ status: next }).eq('id', item.id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function addItem() {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('business_items').insert({
      user_id: session.user.id,
      section: tab,
      title: newTitle,
      status: 'todo',
      sort_order: items.filter(i => i.section === tab).length,
    }).select().single()
    if (data) setItems(prev => [...prev, data])
    setNewTitle('')
    setShowAdd(false)
  }

  async function deleteItem(id) {
    await supabase.from('business_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function saveNotes() {
    setSaving(true)
    await supabase.from('user_content').upsert({ user_id: session.user.id, key: 'business_planning_notes', content: notes }, { onConflict: 'user_id,key' })
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
    setSaving(false)
  }

  const tabItems = items.filter(i => i.section === tab)
  const done = tabItems.filter(i => i.status === 'done').length
  const total = tabItems.length

  return (
    <div>
      <SectionHeader title="Business Planning" subtitle="Build your coaching empire, step by step" />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>
                      {TABS.find(t => t.value === tab)?.label} Checklist
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{done}/{total} complete</p>
                  </div>
                  <Button onClick={() => setShowAdd(true)} variant="secondary" size="sm">+ Add Item</Button>
                </div>

                {total > 0 && (
                  <div className="mb-4">
                    <ProgressBar value={done} max={total} />
                  </div>
                )}

                <div className="space-y-2">
                  {tabItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl group" style={{ background: 'var(--cream)' }}>
                      <button
                        onClick={() => toggleStatus(item)}
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs transition-all"
                        style={{
                          background: item.status === 'done' ? 'var(--gold)' : item.status === 'in_progress' ? '#FEF3C7' : 'white',
                          border: `1.5px solid ${item.status === 'done' ? 'var(--gold)' : item.status === 'in_progress' ? '#FCD34D' : 'var(--brown-200)'}`,
                          color: item.status === 'done' ? 'var(--brown-900)' : item.status === 'in_progress' ? '#92400E' : 'transparent',
                        }}
                      >
                        {item.status === 'done' ? '✓' : item.status === 'in_progress' ? '→' : ''}
                      </button>
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: 'var(--brown-900)',
                          textDecoration: item.status === 'done' ? 'line-through' : 'none',
                          opacity: item.status === 'done' ? 0.5 : 1,
                        }}
                      >
                        {item.title}
                      </span>
                      <Badge status={item.status} className="opacity-0 group-hover:opacity-100 transition-all" />
                      <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-xs transition-all" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                  ))}
                </div>

                {showAdd && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="New checklist item..."
                      className="flex-1"
                    />
                    <Button onClick={addItem} variant="gold" size="sm">Add</Button>
                    <Button onClick={() => setShowAdd(false)} variant="ghost" size="sm">✕</Button>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-5">
                <h2 className="font-serif text-base mb-3" style={{ color: 'var(--brown-900)' }}>Planning Notes</h2>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Your vision, ideas, and strategy notes..."
                  rows={8}
                />
                <div className="flex justify-end mt-3">
                  <SaveButton onClick={saveNotes} loading={saving} saved={noteSaved} />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
