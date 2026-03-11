import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const SCORE_COLOR = (score) => {
  if (!score) return 'bg-stone-100 text-stone-400'
  if (score >= 5) return 'bg-green-100 text-green-700'
  if (score >= 4) return 'bg-lime-100 text-lime-700'
  if (score >= 3) return 'bg-yellow-100 text-yellow-700'
  if (score >= 2) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function Progress({ session }) {
  const [scripts, setScripts] = useState([])
  const [progress, setProgress] = useState({}) // character_id -> progress row
  const [characters, setCharacters] = useState({}) // script_id -> character[]
  const [selectedScript, setSelectedScript] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: scriptData }, { data: charData }, { data: progData }] = await Promise.all([
        supabase.from('scripts').select('*').order('name'),
        supabase.from('characters').select('*').order('sort_order'),
        supabase.from('user_progress').select('*').eq('user_id', session.user.id),
      ])

      setScripts(scriptData || [])
      setSelectedScript(scriptData?.[0]?.id ?? null)

      const charsByScript = {}
      for (const c of charData || []) {
        if (!charsByScript[c.script_id]) charsByScript[c.script_id] = []
        charsByScript[c.script_id].push(c)
      }
      setCharacters(charsByScript)

      const progMap = {}
      for (const p of progData || []) progMap[p.character_id] = p
      setProgress(progMap)
      setLoading(false)
    }
    load()
  }, [session.user.id])

  const scriptChars = characters[selectedScript] || []
  const practiced = scriptChars.filter(c => progress[c.id])
  const avgScore = practiced.length > 0
    ? (practiced.reduce((sum, c) => sum + (progress[c.id]?.best_score ?? 0), 0) / practiced.length).toFixed(1)
    : null

  return (
    <Layout session={session}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif text-stone-800 mb-6">Progress</h1>

        {/* Script tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {scripts.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScript(s.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedScript === s.id
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'border-stone-300 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-stone-800">{practiced.length}</div>
                <div className="text-xs text-stone-500 mt-1">Letters practiced</div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-stone-800">{scriptChars.length}</div>
                <div className="text-xs text-stone-500 mt-1">Total letters</div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-stone-800">{avgScore ?? '—'}</div>
                <div className="text-xs text-stone-500 mt-1">Avg best score</div>
              </div>
            </div>

            {/* Character grid */}
            <div>
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Uppercase</h2>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {scriptChars.filter(c => c.letter_case === 'upper').map(c => {
                  const p = progress[c.id]
                  return (
                    <div
                      key={c.id}
                      title={`${c.label}${p ? ` · Best: ${p.best_score}/5 · ${p.attempt_count} attempts` : ' · Not practiced'}`}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xl font-serif font-semibold cursor-default transition-colors ${SCORE_COLOR(p?.best_score)}`}
                    >
                      {c.character}
                      {p && <span className="text-[9px] font-sans mt-0.5 opacity-70">{p.best_score}</span>}
                    </div>
                  )
                })}
              </div>

              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Lowercase</h2>
              <div className="grid grid-cols-7 gap-2">
                {scriptChars.filter(c => c.letter_case === 'lower').map(c => {
                  const p = progress[c.id]
                  return (
                    <div
                      key={c.id}
                      title={`${c.label}${p ? ` · Best: ${p.best_score}/5 · ${p.attempt_count} attempts` : ' · Not practiced'}`}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xl font-serif font-semibold cursor-default transition-colors ${SCORE_COLOR(p?.best_score)}`}
                    >
                      {c.character}
                      {p && <span className="text-[9px] font-sans mt-0.5 opacity-70">{p.best_score}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
