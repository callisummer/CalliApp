import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Spinner, EmptyState, SaveButton } from '../../components/ui'

const today = () => new Date().toISOString().slice(0, 10)

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function DailyIntentions({ session }) {
  const [date, setDate] = useState(today())
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({
    focus: '',
    intention: '',
    affirmations: ['', '', ''],
    gratitude: ['', '', ''],
    evening_reflection: '',
  })

  const fetchEntry = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('daily_intentions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', date)
      .maybeSingle()

    if (data) {
      setEntry(data)
      setForm({
        focus: data.focus || '',
        intention: data.intention || '',
        affirmations: data.affirmations || ['', '', ''],
        gratitude: data.gratitude || ['', '', ''],
        evening_reflection: data.evening_reflection || '',
      })
    } else {
      setEntry(null)
      setForm({ focus: '', intention: '', affirmations: ['', '', ''], gratitude: ['', '', ''], evening_reflection: '' })
    }
    setLoading(false)
  }, [date, session.user.id])

  useEffect(() => { fetchEntry() }, [fetchEntry])

  useEffect(() => {
    supabase
      .from('daily_intentions')
      .select('id, date, focus, intention')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory(data || []))
  }, [session.user.id, saved])

  async function save() {
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      date,
      focus: form.focus,
      intention: form.intention,
      affirmations: form.affirmations.filter(Boolean),
      gratitude: form.gratitude.filter(Boolean),
      evening_reflection: form.evening_reflection,
    }
    const { error } = await supabase
      .from('daily_intentions')
      .upsert(payload, { onConflict: 'user_id,date' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  function updateAffirmation(i, val) {
    const arr = [...form.affirmations]
    arr[i] = val
    setForm(f => ({ ...f, affirmations: arr }))
  }
  function updateGratitude(i, val) {
    const arr = [...form.gratitude]
    arr[i] = val
    setForm(f => ({ ...f, gratitude: arr }))
  }

  return (
    <div>
      <SectionHeader
        title="Daily Intentions"
        subtitle="Begin each day with purpose and presence"
      >
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'white', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}
        />
      </SectionHeader>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Date display */}
          <div className="flex items-center gap-3">
            <div className="w-px h-8" style={{ background: 'var(--gold)' }} />
            <p className="font-serif text-lg" style={{ color: 'var(--brown-700)' }}>{formatDate(date)}</p>
          </div>

          {/* Morning section */}
          <Card className="p-6">
            <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>Morning Ritual</h2>
            <div className="space-y-5">
              <Input
                label="Today's Focus"
                value={form.focus}
                onChange={e => setForm(f => ({ ...f, focus: e.target.value }))}
                placeholder="What is your one intention for today?"
              />
              <Textarea
                label="My Intention"
                value={form.intention}
                onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
                placeholder="Set a clear, heartfelt intention for your day..."
                rows={3}
              />
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>
                Affirmations
              </h2>
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-3 text-xs font-medium" style={{ color: 'var(--gold)' }}>{i + 1}.</span>
                    <Input
                      value={form.affirmations[i]}
                      onChange={e => updateAffirmation(i, e.target.value)}
                      placeholder={`I am...`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>
                Gratitude
              </h2>
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-3 text-xs font-medium" style={{ color: 'var(--gold)' }}>{i + 1}.</span>
                    <Input
                      value={form.gratitude[i]}
                      onChange={e => updateGratitude(i, e.target.value)}
                      placeholder={`I'm grateful for...`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>Evening Reflection</h2>
            <Textarea
              value={form.evening_reflection}
              onChange={e => setForm(f => ({ ...f, evening_reflection: e.target.value }))}
              placeholder="How did today unfold? What are you releasing? What was beautiful?"
              rows={4}
            />
          </Card>

          <div className="flex justify-end">
            <SaveButton onClick={save} loading={saving} saved={saved} label="Save Today's Entry" />
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-xl mb-4" style={{ color: 'var(--brown-900)' }}>Previous Entries</h2>
              <div className="space-y-3">
                {history.filter(h => h.date !== date).map(h => (
                  <div
                    key={h.id}
                    className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all"
                    style={{ background: 'white', border: '1px solid var(--brown-100)' }}
                    onClick={() => setDate(h.date)}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--gold)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--brown-700)' }}>{formatDate(h.date)}</p>
                      {h.focus && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--brown-500)' }}>{h.focus}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
