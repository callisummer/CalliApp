import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Modal, Badge, EmptyState, Spinner, StarRating } from '../../components/ui'

const ENTRY_TYPES = ['Free Write', 'Healing Session', 'Prompt', 'Affirmation']
const PROMPTS = [
  'What patterns am I ready to release?',
  'Where in my body am I holding tension, and what might it be telling me?',
  'Who am I becoming, and what does she need from me today?',
  'What belief am I ready to let go of that no longer serves me?',
  'What would I do if I truly believed I was worthy of everything I desire?',
  'What does my inner child need to hear right now?',
  'Where am I playing small, and why?',
  'What does my highest self want me to know?',
  'What am I most afraid of, and what would courage look like here?',
  'How have I grown in the past 30 days?',
]

const MOODS = ['😞', '😐', '🙂', '😊', '✨']
const TYPE_COLORS = {
  'Free Write': { bg: '#EDE9FE', color: '#5B21B6' },
  'Healing Session': { bg: '#FCE7F3', color: '#9D174D' },
  'Prompt': { bg: '#FEF3C7', color: '#92400E' },
  'Affirmation': { bg: '#D1FAE5', color: '#065F46' },
}

export default function MindsetHealing({ session }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'Free Write',
    title: '',
    prompt: '',
    content: '',
    mood: 3,
    tags: '',
  })
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.content.trim()) return
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      type: form.type,
      title: form.title || form.type,
      prompt: form.prompt,
      content: form.content,
      mood: form.mood,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      date: new Date().toISOString().slice(0, 10),
    }
    const { data } = await supabase.from('journal_entries').insert(payload).select().single()
    if (data) setEntries(prev => [data, ...prev])
    setForm({ type: 'Free Write', title: '', prompt: '', content: '', mood: 3, tags: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deleteEntry(id) {
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (expanded?.id === id) setExpanded(null)
  }

  function usePrompt() {
    const prompt = PROMPTS[currentPromptIdx]
    setForm(f => ({ ...f, prompt, content: f.content ? f.content : '' }))
    setCurrentPromptIdx(i => (i + 1) % PROMPTS.length)
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <SectionHeader title="Mindset & Healing" subtitle="Your sacred space for inner work and transformation">
        <Button onClick={() => setShowModal(true)} variant="gold">+ New Entry</Button>
      </SectionHeader>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon="🌙"
          title="Your healing journal awaits"
          description="Write freely, heal deeply, and witness your own becoming."
          action={<Button onClick={() => setShowModal(true)} variant="gold">Write Your First Entry</Button>}
        />
      ) : (
        <div className="space-y-4">
          {entries.map(entry => {
            const typeColors = TYPE_COLORS[entry.type] || TYPE_COLORS['Free Write']
            const isExpanded = expanded?.id === entry.id
            return (
              <Card key={entry.id} className="p-5" goldHover>
                <div
                  className="cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : entry)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: typeColors.bg, color: typeColors.color }}
                      >
                        {entry.type}
                      </span>
                      {entry.mood && <span className="text-base">{MOODS[entry.mood - 1]}</span>}
                      <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{formatDate(entry.created_at)}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }}
                      className="text-xs ml-2 flex-shrink-0"
                      style={{ color: 'var(--brown-300)' }}
                    >
                      ✕
                    </button>
                  </div>
                  {entry.title && (
                    <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--brown-900)' }}>{entry.title}</h3>
                  )}
                  {entry.prompt && (
                    <p className="text-xs italic mb-2" style={{ color: 'var(--brown-500)' }}>{entry.prompt}</p>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-700)' }}>
                    {isExpanded ? entry.content : entry.content.slice(0, 150) + (entry.content.length > 150 ? '...' : '')}
                  </p>
                  {entry.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Journal Entry" width="max-w-2xl">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {ENTRY_TYPES.map(type => {
              const colors = TYPE_COLORS[type]
              return (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, type }))}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: form.type === type ? colors.bg : 'var(--cream)',
                    color: form.type === type ? colors.color : 'var(--brown-500)',
                    border: form.type === type ? `1.5px solid ${colors.color}` : '1.5px solid var(--brown-100)',
                  }}
                >
                  {type}
                </button>
              )
            })}
          </div>

          <Input
            label="Title (optional)"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Give this entry a name..."
          />

          {form.type === 'Prompt' && (
            <div>
              {form.prompt && (
                <div className="p-3 rounded-xl mb-2 italic text-sm" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  "{form.prompt}"
                </div>
              )}
              <Button onClick={usePrompt} variant="secondary" size="sm">
                {form.prompt ? 'Next Prompt' : 'Get a Prompt'}
              </Button>
            </div>
          )}

          <Textarea
            label="Your entry"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write freely, without judgment. This is your sacred space..."
            rows={8}
          />

          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>
              Mood
            </label>
            <div className="flex gap-3">
              {MOODS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setForm(f => ({ ...f, mood: i + 1 }))}
                  className="text-2xl transition-all"
                  style={{ opacity: form.mood === i + 1 ? 1 : 0.4, transform: form.mood === i + 1 ? 'scale(1.2)' : 'scale(1)' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Tags (comma separated)"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="healing, shadow work, gratitude..."
          />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving || !form.content.trim()} className="flex-1">
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
