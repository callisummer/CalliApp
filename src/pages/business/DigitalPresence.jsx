import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, SaveButton, Spinner } from '../../components/ui'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000000' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' },
  { key: 'podcast', label: 'Podcast', icon: '🎙️', color: '#8B5CF6' },
  { key: 'website', label: 'Website', icon: '🌐', color: '#1E40AF' },
  { key: 'email_list', label: 'Email List', icon: '📧', color: '#065F46' },
]

export default function DigitalPresence({ session }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const keys = PLATFORMS.map(p => `digital_${p.key}`)
    const { data: rows } = await supabase.from('user_content').select('key, content').eq('user_id', session.user.id).in('key', keys)
    const map = {}
    ;(rows || []).forEach(r => {
      try { map[r.key] = JSON.parse(r.content) } catch { map[r.key] = {} }
    })
    setData(map)
    setLoading(false)
  }

  function update(platform, field, value) {
    const key = `digital_${platform}`
    setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }))
  }

  async function saveAll() {
    setSaving(true)
    const upserts = PLATFORMS.map(p => ({
      user_id: session.user.id,
      key: `digital_${p.key}`,
      content: JSON.stringify(data[`digital_${p.key}`] || {}),
    }))
    await supabase.from('user_content').upsert(upserts, { onConflict: 'user_id,key' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Digital Presence" subtitle="Build your online home and community">
        <SaveButton onClick={saveAll} loading={saving} saved={saved} label="Save All" />
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLATFORMS.map(platform => {
            const key = `digital_${platform.key}`
            const pData = data[key] || {}
            return (
              <Card key={platform.key} className="p-5" goldHover>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{platform.icon}</span>
                  <h3 className="font-serif text-base font-medium" style={{ color: 'var(--brown-900)' }}>{platform.label}</h3>
                </div>
                <div className="space-y-3">
                  <Input
                    label="Handle / URL"
                    value={pData.handle || ''}
                    onChange={e => update(platform.key, 'handle', e.target.value)}
                    placeholder={platform.key === 'website' ? 'https://mysite.com' : `@username`}
                  />
                  <Input
                    label="Current Followers / Subscribers"
                    type="number"
                    value={pData.followers || ''}
                    onChange={e => update(platform.key, 'followers', e.target.value)}
                    placeholder="1200"
                  />
                  <Input
                    label="Goal"
                    value={pData.goal || ''}
                    onChange={e => update(platform.key, 'goal', e.target.value)}
                    placeholder="10k by December..."
                  />
                  <Textarea
                    label="Strategy / Notes"
                    value={pData.notes || ''}
                    onChange={e => update(platform.key, 'notes', e.target.value)}
                    placeholder="Content strategy, posting schedule..."
                    rows={2}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
