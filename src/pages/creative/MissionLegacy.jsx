import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, SaveButton, Spinner } from '../../components/ui'

const SECTIONS = [
  {
    key: 'mission_statement',
    label: 'Personal Mission Statement',
    subtitle: 'The one sentence that captures why you are here',
    placeholder: 'I am here to...',
    rows: 4,
  },
  {
    key: 'mission_impact',
    label: 'The Impact I Want to Have',
    subtitle: 'How do you want to change lives, communities, and the world?',
    placeholder: 'I want to create a world where...',
    rows: 5,
  },
  {
    key: 'mission_remembered',
    label: 'How I Want to Be Remembered',
    subtitle: 'What do you want said about you at the end of your life?',
    placeholder: 'She was someone who...',
    rows: 4,
  },
  {
    key: 'mission_change',
    label: 'The Change I Want to Create',
    subtitle: 'What problems are you solving? What shift are you creating?',
    placeholder: 'I am committed to changing...',
    rows: 4,
  },
]

export default function MissionLegacy({ session }) {
  const [content, setContent] = useState({})
  const [values, setValues] = useState([])
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wordCounts, setWordCounts] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const keys = [...SECTIONS.map(s => s.key), 'mission_values']
    const { data } = await supabase.from('user_content').select('key, content').eq('user_id', session.user.id).in('key', keys)
    const map = {}
    ;(data || []).forEach(d => { map[d.key] = d.content })
    setContent(map)
    if (map.mission_values) {
      try { setValues(JSON.parse(map.mission_values)) } catch { setValues([]) }
    }
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    const upserts = [
      ...SECTIONS.map(s => ({ user_id: session.user.id, key: s.key, content: content[s.key] || '' })),
      { user_id: session.user.id, key: 'mission_values', content: JSON.stringify(values) },
    ]
    await supabase.from('user_content').upsert(upserts, { onConflict: 'user_id,key' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setSaving(false)
  }

  function updateContent(key, val) {
    setContent(c => ({ ...c, [key]: val }))
    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCounts(wc => ({ ...wc, [key]: words }))
  }

  function addValue() {
    if (!newValue.trim()) return
    setValues(prev => [...prev, newValue.trim()])
    setNewValue('')
  }

  function removeValue(v) {
    setValues(prev => prev.filter(val => val !== v))
  }

  return (
    <div>
      <SectionHeader title="Mission & Legacy" subtitle="Why you are here and the mark you will leave">
        <SaveButton onClick={saveAll} loading={saving} saved={saved} label="Save All" />
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="space-y-6">
          {/* Core Values */}
          <Card className="p-6" style={{ border: '2px solid var(--gold)' }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-xl" style={{ color: 'var(--gold)' }}>✦</div>
              <h2 className="font-serif text-xl" style={{ color: 'var(--brown-900)' }}>My Core Values</h2>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--brown-500)' }}>The principles that are non-negotiable in how you live and lead</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {values.map(v => (
                <div key={v} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'var(--brown-900)', color: 'var(--gold-light)' }}>
                  <span className="text-sm font-medium">{v}</span>
                  <button onClick={() => removeValue(v)} className="text-xs opacity-60 hover:opacity-100">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Add a core value..."
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && addValue()}
              />
              <Button onClick={addValue} variant="gold" size="sm">Add</Button>
            </div>
          </Card>

          {SECTIONS.map(section => (
            <Card key={section.key} className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-6 rounded-full" style={{ background: 'var(--gold)' }} />
                  <h2 className="font-serif text-xl" style={{ color: 'var(--brown-900)' }}>{section.label}</h2>
                </div>
                <p className="text-sm ml-3" style={{ color: 'var(--brown-500)' }}>{section.subtitle}</p>
              </div>
              <Textarea
                value={content[section.key] || ''}
                onChange={e => updateContent(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={section.rows}
              />
              {wordCounts[section.key] !== undefined && (
                <p className="text-xs text-right mt-1" style={{ color: 'var(--brown-300)' }}>{wordCounts[section.key]} words</p>
              )}
            </Card>
          ))}

          <div className="flex justify-center pb-4">
            <SaveButton onClick={saveAll} loading={saving} saved={saved} label="Save All" />
          </div>
        </div>
      )}
    </div>
  )
}
