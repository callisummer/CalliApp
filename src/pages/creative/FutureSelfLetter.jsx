import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, SaveButton, Input, Spinner } from '../../components/ui'

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

export default function FutureSelfLetter({ session }) {
  const [letter, setLetter] = useState('')
  const [rereadDate, setRereadDate] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('user_content')
      .select('content, updated_at')
      .eq('user_id', session.user.id)
      .eq('key', 'future_self_letter')
      .maybeSingle()

    if (data) {
      try {
        const parsed = JSON.parse(data.content)
        setLetter(parsed.letter || '')
        setRereadDate(parsed.reread_date || '')
      } catch {
        setLetter(data.content || '')
      }
      setLastSaved(data.updated_at)
    }
    setLoading(false)
  }

  async function saveLetter() {
    setSaving(true)
    const content = JSON.stringify({ letter, reread_date: rereadDate })
    const { data } = await supabase.from('user_content').upsert({
      user_id: session.user.id,
      key: 'future_self_letter',
      content,
    }, { onConflict: 'user_id,key' }).select('updated_at').single()

    if (data) setLastSaved(data.updated_at)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  function formatSaved(ts) {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <SectionHeader title="Letter to Future Self" subtitle="A sacred message across time, from who you are now to who you are becoming">
        <SaveButton onClick={saveLetter} loading={saving} saved={saved} label="Save Letter" />
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 lg:p-12">
            {/* Letterhead */}
            <div className="mb-8 text-center pb-6" style={{ borderBottom: '1px solid var(--brown-100)' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brown-300)' }}>A Letter Written With Love</p>
              <div className="text-2xl mb-3" style={{ color: 'var(--gold)' }}>✦</div>
              <p className="font-serif text-lg italic" style={{ color: 'var(--brown-500)' }}>{today}</p>
            </div>

            {/* Salutation */}
            <div className="mb-6">
              <p className="font-serif text-2xl italic" style={{ color: 'var(--brown-900)' }}>Dear Future Me,</p>
            </div>

            {/* Letter body */}
            <div className="mb-8">
              <textarea
                value={letter}
                onChange={e => setLetter(e.target.value)}
                placeholder="Write from your heart... Tell her who you are right now. What you're working through. What you're proud of. What you're calling in. What you want her to know. What advice you'd give her. What you're grateful for. How much you love her already..."
                className="w-full text-sm leading-8 outline-none resize-none"
                rows={20}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brown-800)',
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: '1.05rem',
                }}
              />
            </div>

            {/* Sign-off */}
            <div className="mb-8 pt-6" style={{ borderTop: '1px solid var(--brown-100)' }}>
              <p className="font-serif text-lg italic" style={{ color: 'var(--brown-900)' }}>With all my love,</p>
              <p className="font-serif text-lg mt-1" style={{ color: 'var(--brown-700)' }}>Your Present Self</p>
              <p className="text-sm mt-1 italic" style={{ color: 'var(--brown-500)' }}>{today}</p>
            </div>

            {/* Reread date */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--cream)', border: '1px solid var(--brown-100)' }}>
              <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>Set a date to reread this letter</p>
              <input
                type="date"
                value={rereadDate}
                onChange={e => setRereadDate(e.target.value)}
                className="text-sm outline-none"
                style={{ background: 'transparent', color: 'var(--brown-700)', border: 'none' }}
              />
              {rereadDate && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--brown-500)' }}>
                  Your future self will read this on {new Date(rereadDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            {lastSaved && (
              <p className="text-xs text-center mt-6" style={{ color: 'var(--brown-300)' }}>
                Last saved {formatSaved(lastSaved)}
              </p>
            )}
          </Card>

          <div className="flex justify-center mt-6">
            <SaveButton onClick={saveLetter} loading={saving} saved={saved} label="Save Letter" />
          </div>
        </div>
      )}
    </div>
  )
}
