import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, SaveButton, Spinner } from '../../components/ui'

const SECTIONS = [
  { key: 'brand_story', label: 'My Story', placeholder: 'Share your journey — where you came from, what you\'ve been through, and how it shaped who you are today...', rows: 6 },
  { key: 'brand_mission', label: 'My Mission', placeholder: 'I exist to help people...', rows: 4 },
  { key: 'brand_ideal_client', label: 'My Ideal Client', placeholder: 'She is... She struggles with... She dreams of... She\'s ready to...', rows: 5 },
  { key: 'brand_unique_gifts', label: 'My Unique Gifts', placeholder: 'What makes me different... What I bring that no one else can...', rows: 4 },
  { key: 'brand_voice', label: 'Brand Voice & Aesthetic', placeholder: 'My brand feels like... I communicate with... My visual aesthetic is...', rows: 4 },
]

export default function PersonalBrand({ session }) {
  const [content, setContent] = useState({})
  const [values, setValues] = useState([])
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const keys = [...SECTIONS.map(s => s.key), 'brand_values']
    const { data } = await supabase.from('user_content').select('key, content').eq('user_id', session.user.id).in('key', keys)
    const map = {}
    ;(data || []).forEach(d => { map[d.key] = d.content })
    setContent(map)
    if (map.brand_values) {
      try { setValues(JSON.parse(map.brand_values)) } catch { setValues([]) }
    }
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    const upserts = [
      ...SECTIONS.map(s => ({ user_id: session.user.id, key: s.key, content: content[s.key] || '' })),
      { user_id: session.user.id, key: 'brand_values', content: JSON.stringify(values) },
    ]
    await supabase.from('user_content').upsert(upserts, { onConflict: 'user_id,key' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
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
      <SectionHeader title="Personal Brand" subtitle="Your authentic story, values, and voice">
        <SaveButton onClick={saveAll} loading={saving} saved={saved} label="Save All" />
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="space-y-6">
          {/* Values first */}
          <Card className="p-6">
            <h2 className="font-serif text-lg mb-2" style={{ color: 'var(--brown-900)' }}>My Core Values</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--brown-500)' }}>The principles that guide everything you do</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {values.map(v => (
                <div
                  key={v}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ background: 'var(--brown-900)', color: 'var(--gold-light)' }}
                >
                  <span>{v}</span>
                  <button onClick={() => removeValue(v)} className="text-xs opacity-60 hover:opacity-100">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Add a value (Authenticity, Freedom, Healing...)"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && addValue()}
              />
              <Button onClick={addValue} variant="gold" size="sm">Add</Button>
            </div>
          </Card>

          {SECTIONS.map(section => (
            <Card key={section.key} className="p-6">
              <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--brown-900)' }}>{section.label}</h2>
              <div className="w-8 h-0.5 mb-4" style={{ background: 'var(--gold)' }} />
              <Textarea
                value={content[section.key] || ''}
                onChange={e => setContent(c => ({ ...c, [section.key]: e.target.value }))}
                placeholder={section.placeholder}
                rows={section.rows}
              />
            </Card>
          ))}

          <div className="flex justify-end pb-4">
            <SaveButton onClick={saveAll} loading={saving} saved={saved} label="Save All" />
          </div>
        </div>
      )}
    </div>
  )
}
