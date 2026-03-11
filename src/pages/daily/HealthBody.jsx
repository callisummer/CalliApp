import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Tabs, SaveButton, Spinner, StarRating } from '../../components/ui'

const today = () => new Date().toISOString().slice(0, 10)
const PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal']
const PHASE_COLORS = {
  menstrual: { bg: '#FEE2E2', color: '#991B1B' },
  follicular: { bg: '#FCE7F3', color: '#9D174D' },
  ovulatory: { bg: '#D1FAE5', color: '#065F46' },
  luteal: { bg: '#FEF3C7', color: '#92400E' },
}

export default function HealthBody({ session }) {
  const [date, setDate] = useState(today())
  const [tab, setTab] = useState('Sleep')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [log, setLog] = useState({
    sleep_hours: '',
    sleep_quality: 0,
    cycle_day: '',
    cycle_phase: '',
    energy_level: 0,
    water_oz: '',
    meals: [],
    workouts: [],
    supplements: '',
    notes: '',
  })
  const [newMeal, setNewMeal] = useState({ time: '', description: '', feeling: '' })
  const [newWorkout, setNewWorkout] = useState({ type: '', duration: '', notes: '' })

  const fetchLog = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', date)
      .maybeSingle()
    if (data) {
      setLog({
        sleep_hours: data.sleep_hours ?? '',
        sleep_quality: data.sleep_quality ?? 0,
        cycle_day: data.cycle_day ?? '',
        cycle_phase: data.cycle_phase ?? '',
        energy_level: data.energy_level ?? 0,
        water_oz: data.water_oz ?? '',
        meals: data.meals ?? [],
        workouts: data.workouts ?? [],
        supplements: data.supplements ?? '',
        notes: data.notes ?? '',
      })
    } else {
      setLog({ sleep_hours: '', sleep_quality: 0, cycle_day: '', cycle_phase: '', energy_level: 0, water_oz: '', meals: [], workouts: [], supplements: '', notes: '' })
    }
    setLoading(false)
  }, [date, session.user.id])

  useEffect(() => { fetchLog() }, [fetchLog])

  async function save() {
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      date,
      sleep_hours: log.sleep_hours || null,
      sleep_quality: log.sleep_quality || null,
      cycle_day: log.cycle_day || null,
      cycle_phase: log.cycle_phase || null,
      energy_level: log.energy_level || null,
      water_oz: log.water_oz || null,
      meals: log.meals,
      workouts: log.workouts,
      supplements: log.supplements,
      notes: log.notes,
    }
    const { error } = await supabase.from('health_logs').upsert(payload, { onConflict: 'user_id,date' })
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  function addMeal() {
    if (!newMeal.description.trim()) return
    setLog(l => ({ ...l, meals: [...(l.meals || []), newMeal] }))
    setNewMeal({ time: '', description: '', feeling: '' })
  }

  function removeMeal(i) {
    setLog(l => ({ ...l, meals: l.meals.filter((_, idx) => idx !== i) }))
  }

  function addWorkout() {
    if (!newWorkout.type.trim()) return
    setLog(l => ({ ...l, workouts: [...(l.workouts || []), newWorkout] }))
    setNewWorkout({ type: '', duration: '', notes: '' })
  }

  function removeWorkout(i) {
    setLog(l => ({ ...l, workouts: l.workouts.filter((_, idx) => idx !== i) }))
  }

  const phaseColors = PHASE_COLORS[log.cycle_phase] || {}

  return (
    <div>
      <SectionHeader title="Health & Body" subtitle="Honor your body as the sacred vessel it is">
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
        <>
          <Tabs
            tabs={['Sleep', 'Nourishment', 'Movement', 'Cycle']}
            active={tab}
            onChange={setTab}
          />

          {tab === 'Sleep' && (
            <Card className="p-6 space-y-6">
              <h2 className="font-serif text-lg" style={{ color: 'var(--brown-900)' }}>Sleep Log</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Hours Slept"
                  type="number"
                  value={log.sleep_hours}
                  onChange={e => setLog(l => ({ ...l, sleep_hours: e.target.value }))}
                  placeholder="7.5"
                />
                <div>
                  <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>
                    Sleep Quality
                  </label>
                  <StarRating value={log.sleep_quality} onChange={v => setLog(l => ({ ...l, sleep_quality: v }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>Energy Level Today</label>
                <StarRating value={log.energy_level} onChange={v => setLog(l => ({ ...l, energy_level: v }))} />
              </div>
              <Textarea
                label="Sleep Notes"
                value={log.notes}
                onChange={e => setLog(l => ({ ...l, notes: e.target.value }))}
                placeholder="Dreams, sleep quality notes, how you woke up..."
                rows={3}
              />
            </Card>
          )}

          {tab === 'Nourishment' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg" style={{ color: 'var(--brown-900)' }}>Nourishment</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={log.water_oz}
                    onChange={e => setLog(l => ({ ...l, water_oz: e.target.value }))}
                    placeholder="64"
                    type="number"
                    className="w-24"
                  />
                  <span className="text-sm" style={{ color: 'var(--brown-500)' }}>oz water</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--brown-700)' }}>Meals</h3>
                <div className="space-y-2 mb-4">
                  {(log.meals || []).map((meal, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {meal.time && <span className="text-xs" style={{ color: 'var(--gold)' }}>{meal.time}</span>}
                          <span className="text-sm" style={{ color: 'var(--brown-900)' }}>{meal.description}</span>
                        </div>
                        {meal.feeling && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>Felt: {meal.feeling}</p>}
                      </div>
                      <button onClick={() => removeMeal(i)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Input value={newMeal.time} onChange={e => setNewMeal(m => ({ ...m, time: e.target.value }))} placeholder="Time (8am)" type="text" />
                  <Input value={newMeal.description} onChange={e => setNewMeal(m => ({ ...m, description: e.target.value }))} placeholder="What you ate" className="col-span-1" />
                  <Input value={newMeal.feeling} onChange={e => setNewMeal(m => ({ ...m, feeling: e.target.value }))} placeholder="How you felt" />
                </div>
                <Button onClick={addMeal} variant="secondary" size="sm">+ Add Meal</Button>
              </div>

              <Input
                label="Supplements / Herbs"
                value={log.supplements}
                onChange={e => setLog(l => ({ ...l, supplements: e.target.value }))}
                placeholder="Ashwagandha, mushroom blend, prenatal..."
              />
            </Card>
          )}

          {tab === 'Movement' && (
            <Card className="p-6 space-y-6">
              <h2 className="font-serif text-lg" style={{ color: 'var(--brown-900)' }}>Movement</h2>
              <div className="space-y-2 mb-4">
                {(log.workouts || []).map((w, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{w.type}</span>
                        {w.duration && <span className="text-xs" style={{ color: 'var(--brown-500)' }}>{w.duration}</span>}
                      </div>
                      {w.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--brown-500)' }}>{w.notes}</p>}
                    </div>
                    <button onClick={() => removeWorkout(i)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input value={newWorkout.type} onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))} placeholder="Yoga, walk, gym..." />
                <Input value={newWorkout.duration} onChange={e => setNewWorkout(w => ({ ...w, duration: e.target.value }))} placeholder="45 min" />
                <Input value={newWorkout.notes} onChange={e => setNewWorkout(w => ({ ...w, notes: e.target.value }))} placeholder="Notes" />
              </div>
              <Button onClick={addWorkout} variant="secondary" size="sm">+ Add Movement</Button>
            </Card>
          )}

          {tab === 'Cycle' && (
            <Card className="p-6 space-y-6">
              <h2 className="font-serif text-lg" style={{ color: 'var(--brown-900)' }}>Cycle Tracking</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Cycle Day"
                  type="number"
                  value={log.cycle_day}
                  onChange={e => setLog(l => ({ ...l, cycle_day: e.target.value }))}
                  placeholder="14"
                />
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>Phase</label>
                  <div className="flex flex-wrap gap-2">
                    {PHASES.map(phase => {
                      const colors = PHASE_COLORS[phase]
                      const active = log.cycle_phase === phase
                      return (
                        <button
                          key={phase}
                          onClick={() => setLog(l => ({ ...l, cycle_phase: active ? '' : phase }))}
                          className="px-3 py-1.5 rounded-lg text-sm capitalize transition-all"
                          style={{
                            background: active ? colors.bg : 'var(--cream)',
                            color: active ? colors.color : 'var(--brown-500)',
                            border: active ? `1.5px solid ${colors.color}` : '1.5px solid var(--brown-100)',
                          }}
                        >
                          {phase}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--brown-500)' }}>Energy Level</label>
                <StarRating value={log.energy_level} onChange={v => setLog(l => ({ ...l, energy_level: v }))} />
              </div>
              {log.cycle_phase && (
                <div className="p-4 rounded-xl" style={{ background: phaseColors.bg }}>
                  <p className="text-sm font-medium capitalize mb-1" style={{ color: phaseColors.color }}>{log.cycle_phase} Phase</p>
                  <p className="text-xs" style={{ color: phaseColors.color, opacity: 0.8 }}>
                    {log.cycle_phase === 'menstrual' && 'Rest, reflect, and release. Honor your need for stillness.'}
                    {log.cycle_phase === 'follicular' && 'Energy is rising. A great time to start new projects and plan.'}
                    {log.cycle_phase === 'ovulatory' && 'Peak energy and magnetism. Ideal for connecting and creating.'}
                    {log.cycle_phase === 'luteal' && 'Turn inward. Complete tasks and prepare for reflection.'}
                  </p>
                </div>
              )}
              <Textarea
                label="Notes"
                value={log.notes}
                onChange={e => setLog(l => ({ ...l, notes: e.target.value }))}
                placeholder="How are you feeling in your body today?"
                rows={3}
              />
            </Card>
          )}

          <div className="flex justify-end mt-6">
            <SaveButton onClick={save} loading={saving} saved={saved} label="Save Health Log" />
          </div>
        </>
      )}
    </div>
  )
}
