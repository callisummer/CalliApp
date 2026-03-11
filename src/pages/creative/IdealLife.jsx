import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Tabs, SaveButton, Spinner } from '../../components/ui'

const LIFE_AREAS = [
  {
    value: 'overall',
    label: 'Overall Vision',
    icon: '✦',
    prompt: 'Paint the full picture of your ideal life. What does a perfect day look like? How do you feel every morning? What have you created?',
  },
  {
    value: 'career',
    label: 'Career & Purpose',
    icon: '✨',
    prompt: 'What work fills your soul? How do you spend your days? What impact are you having? How are you serving?',
  },
  {
    value: 'love',
    label: 'Love & Relationships',
    icon: '💖',
    prompt: 'What do your most important relationships feel like? How do you love and receive love? Who surrounds you?',
  },
  {
    value: 'health',
    label: 'Health & Vitality',
    icon: '💚',
    prompt: 'How does your body feel? What practices keep you well? How do you honor your physical vessel?',
  },
  {
    value: 'home',
    label: 'Home & Environment',
    icon: '🏡',
    prompt: 'Describe your ideal home. Where is it? How does it feel? What does it look like? Who shares it with you?',
  },
  {
    value: 'financial',
    label: 'Financial Freedom',
    icon: '💛',
    prompt: 'What does financial freedom look like for you? What does money flow feel like? What do you have, give, and experience?',
  },
  {
    value: 'spiritual',
    label: 'Spiritual Life',
    icon: '🌿',
    prompt: 'How do you connect to the divine? What practices ground you? What does your spiritual life look and feel like?',
  },
  {
    value: 'adventure',
    label: 'Adventure & Joy',
    icon: '🌟',
    prompt: 'What fills you with pure joy? Where do you travel? What adventures do you have? What makes your heart sing?',
  },
]

export default function IdealLife({ session }) {
  const [area, setArea] = useState('overall')
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const keys = LIFE_AREAS.flatMap(a => [
      `ideal_${a.value}_description`,
      `ideal_${a.value}_affirm1`,
      `ideal_${a.value}_affirm2`,
      `ideal_${a.value}_affirm3`,
    ])
    const { data } = await supabase.from('user_content').select('key, content').eq('user_id', session.user.id).in('key', keys)
    const map = {}
    ;(data || []).forEach(d => { map[d.key] = d.content })
    setContent(map)
    setLoading(false)
  }

  function get(key) { return content[key] || '' }
  function set(key, value) { setContent(c => ({ ...c, [key]: value })) }

  async function saveArea() {
    setSaving(true)
    const keys = [
      `ideal_${area}_description`,
      `ideal_${area}_affirm1`,
      `ideal_${area}_affirm2`,
      `ideal_${area}_affirm3`,
    ]
    const upserts = keys.map(key => ({ user_id: session.user.id, key, content: content[key] || '' }))
    await supabase.from('user_content').upsert(upserts, { onConflict: 'user_id,key' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const currentArea = LIFE_AREAS.find(a => a.value === area)

  return (
    <div>
      <SectionHeader title="My Ideal Life" subtitle="A detailed vision of the life you are creating" />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {/* Area tabs - scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {LIFE_AREAS.map(a => (
              <button
                key={a.value}
                onClick={() => setArea(a.value)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: area === a.value ? 'var(--brown-900)' : 'white',
                  color: area === a.value ? 'var(--cream)' : 'var(--brown-500)',
                  border: `1px solid ${area === a.value ? 'var(--brown-900)' : 'var(--brown-100)'}`,
                }}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>

          {currentArea && (
            <div className="max-w-3xl">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl">{currentArea.icon}</div>
                <div>
                  <h2 className="font-serif text-2xl" style={{ color: 'var(--brown-900)' }}>{currentArea.label}</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--brown-500)' }}>{currentArea.prompt}</p>
                </div>
              </div>

              <div className="space-y-5">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 rounded-full" style={{ background: 'var(--gold)' }} />
                    <h3 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>My Vision</h3>
                  </div>
                  <Textarea
                    value={get(`ideal_${area}_description`)}
                    onChange={e => set(`ideal_${area}_description`, e.target.value)}
                    placeholder={currentArea.prompt}
                    rows={8}
                  />
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full" style={{ background: 'var(--gold)' }} />
                    <h3 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>My Affirmations</h3>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--brown-500)' }}>Speak these as present truth — not future wishes</p>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm font-medium flex-shrink-0" style={{ color: 'var(--gold)' }}>I {['am', 'have', 'feel'][i - 1]}...</span>
                        <Input
                          value={get(`ideal_${area}_affirm${i}`)}
                          onChange={e => set(`ideal_${area}_affirm${i}`, e.target.value)}
                          placeholder={`I ${['am', 'have', 'feel'][i - 1]}...`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end">
                  <SaveButton onClick={saveArea} loading={saving} saved={saved} label={`Save ${currentArea.label}`} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
