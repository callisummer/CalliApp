import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const SCORE_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Perfect' }
const SCORE_COLORS = {
  1: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200',
  2: 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200',
  3: 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200',
  4: 'bg-lime-100 border-lime-300 text-lime-700 hover:bg-lime-200',
  5: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200',
}

export default function Practice({ session }) {
  const { scriptId } = useParams()
  const navigate = useNavigate()

  const [script, setScript] = useState(null)
  const [characters, setCharacters] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ total: 0, sum: 0 })
  const [caseFilter, setCaseFilter] = useState('both') // 'upper' | 'lower' | 'both'

  useEffect(() => {
    async function init() {
      const [{ data: scriptData }, { data: charsData }] = await Promise.all([
        supabase.from('scripts').select('*').eq('id', scriptId).single(),
        supabase.from('characters').select('*').eq('script_id', scriptId).order('sort_order'),
      ])
      setScript(scriptData)
      setCharacters(charsData || [])

      const { data: sess } = await supabase
        .from('practice_sessions')
        .insert({ user_id: session.user.id, script_id: scriptId })
        .select('id')
        .single()
      setSessionId(sess.id)
      setLoading(false)
    }
    init()
  }, [scriptId, session.user.id])

  const filteredChars = characters.filter(c => {
    if (caseFilter === 'upper') return c.letter_case === 'upper'
    if (caseFilter === 'lower') return c.letter_case === 'lower'
    return true
  })

  const currentChar = filteredChars[index]

  const handleScore = useCallback(async (score) => {
    if (submitting || !currentChar || !sessionId) return
    setSubmitting(true)

    await Promise.all([
      supabase.from('practice_attempts').insert({
        session_id: sessionId,
        character_id: currentChar.id,
        score,
      }),
      supabase.from('user_progress').upsert({
        user_id: session.user.id,
        character_id: currentChar.id,
        last_practiced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,character_id', ignoreDuplicates: false }).then(async () => {
        // Update best_score and attempt_count separately to use max logic
        const { data: existing } = await supabase
          .from('user_progress')
          .select('best_score, attempt_count')
          .eq('user_id', session.user.id)
          .eq('character_id', currentChar.id)
          .single()
        if (existing) {
          await supabase.from('user_progress').update({
            best_score: Math.max(existing.best_score, score),
            attempt_count: existing.attempt_count + 1,
            last_practiced_at: new Date().toISOString(),
          }).eq('user_id', session.user.id).eq('character_id', currentChar.id)
        }
      }),
    ])

    setStats(s => ({ total: s.total + 1, sum: s.sum + score }))
    const nextIndex = index + 1
    if (nextIndex >= filteredChars.length) {
      await supabase.from('practice_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId)
      setDone(true)
    } else {
      setIndex(nextIndex)
    }
    setSubmitting(false)
  }, [submitting, currentChar, sessionId, index, filteredChars.length, session.user.id])

  if (loading) {
    return (
      <Layout session={session}>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (done) {
    const avg = stats.total > 0 ? (stats.sum / stats.total).toFixed(1) : '—'
    return (
      <Layout session={session}>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Session complete!</h1>
          <p className="text-stone-500 mb-2">{script?.name} · {stats.total} letters</p>
          <p className="text-2xl font-semibold text-stone-700 mb-8">Average score: {avg} / 5</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setIndex(0); setDone(false); setStats({ total: 0, sum: 0 }) }}
              className="px-6 py-2.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
            >
              Practice again
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="px-6 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
            >
              View progress
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const progress = filteredChars.length > 0 ? ((index / filteredChars.length) * 100).toFixed(0) : 0

  return (
    <Layout session={session}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-stone-800">{script?.name}</h1>
            <p className="text-sm text-stone-500">{index + 1} of {filteredChars.length}</p>
          </div>
          <button onClick={() => navigate('/')} className="text-stone-400 hover:text-stone-600 text-sm">
            ✕ Exit
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-stone-200 rounded-full mb-8">
          <div className="h-1.5 bg-stone-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Case filter */}
        <div className="flex gap-2 mb-8 justify-center">
          {['both', 'upper', 'lower'].map(f => (
            <button
              key={f}
              onClick={() => { setCaseFilter(f); setIndex(0) }}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                caseFilter === f
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'border-stone-300 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f === 'both' ? 'All' : f === 'upper' ? 'Uppercase' : 'Lowercase'}
            </button>
          ))}
        </div>

        {/* Character card */}
        <div className="bg-white border border-stone-200 rounded-3xl shadow-sm p-10 text-center mb-8">
          <div className="text-[120px] leading-none font-serif text-stone-800 mb-4 select-none">
            {currentChar?.character}
          </div>
          <p className="text-stone-500 text-sm">{currentChar?.label}</p>
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: currentChar?.difficulty ?? 1 }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
            ))}
          </div>
        </div>

        {/* Score buttons */}
        <p className="text-center text-sm text-stone-500 mb-3">How did that feel?</p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => handleScore(score)}
              disabled={submitting}
              className={`py-4 rounded-xl border-2 font-semibold text-lg transition-all disabled:opacity-40 ${SCORE_COLORS[score]}`}
            >
              {score}
              <span className="block text-xs font-normal mt-0.5">{SCORE_LABELS[score]}</span>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
