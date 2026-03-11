import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const SCRIPT_ICONS = {
  'Copperplate': '✒️',
  'Spencerian': '🖊️',
  'Italic': '🖋️',
  'Gothic/Blackletter': '⚜️',
}

export default function Home({ session }) {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('scripts').select('*').order('name').then(({ data }) => {
      setScripts(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <Layout session={session}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif text-stone-800 mb-2">Choose a script</h1>
        <p className="text-stone-500 mb-8">Select a calligraphy style to begin practicing.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {scripts.map(script => (
              <button
                key={script.id}
                onClick={() => navigate(`/practice/${script.id}`)}
                className="text-left p-6 bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:border-stone-300 transition-all group"
              >
                <div className="text-3xl mb-3">{SCRIPT_ICONS[script.name] ?? '✏️'}</div>
                <h2 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900 mb-1">
                  {script.name}
                </h2>
                <p className="text-sm text-stone-500 leading-snug">{script.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
