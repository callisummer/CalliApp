import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Tabs, Modal, Badge, EmptyState, Spinner } from '../../components/ui'

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

const INVESTMENT_TYPES = ['Stocks', 'ETF', 'Index Fund', 'Crypto', 'Real Estate', 'Bonds', 'Savings', 'Other']
const STREAM_TYPES = ['active', 'passive', 'side-hustle']
const STREAM_STATUSES = ['idea', 'planning', 'active', 'paused']

export default function WealthBuilding({ session }) {
  const [tab, setTab] = useState('Investments')
  const [investments, setInvestments] = useState([])
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invForm, setInvForm] = useState({ name: '', type: '', amount_invested: '', current_value: '', account: '', notes: '' })
  const [streamForm, setStreamForm] = useState({ name: '', type: 'passive', status: 'idea', monthly_amount: '', description: '', next_steps: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: inv }, { data: str }] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', session.user.id).order('created_at'),
      supabase.from('income_streams').select('*').eq('user_id', session.user.id).order('created_at'),
    ])
    setInvestments(inv || [])
    setStreams(str || [])
    setLoading(false)
  }

  async function addInvestment() {
    if (!invForm.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('investments').insert({ user_id: session.user.id, ...invForm, amount_invested: parseFloat(invForm.amount_invested || 0), current_value: parseFloat(invForm.current_value || 0) }).select().single()
    if (data) setInvestments(prev => [...prev, data])
    setInvForm({ name: '', type: '', amount_invested: '', current_value: '', account: '', notes: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function addStream() {
    if (!streamForm.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('income_streams').insert({ user_id: session.user.id, ...streamForm, monthly_amount: streamForm.monthly_amount ? parseFloat(streamForm.monthly_amount) : null }).select().single()
    if (data) setStreams(prev => [...prev, data])
    setStreamForm({ name: '', type: 'passive', status: 'idea', monthly_amount: '', description: '', next_steps: '' })
    setShowModal(false)
    setSaving(false)
  }

  async function deleteInvestment(id) {
    await supabase.from('investments').delete().eq('id', id)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  async function deleteStream(id) {
    await supabase.from('income_streams').delete().eq('id', id)
    setStreams(prev => prev.filter(s => s.id !== id))
  }

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount_invested), 0)
  const totalValue = investments.reduce((s, i) => s + Number(i.current_value), 0)
  const totalGain = totalValue - totalInvested
  const monthlyPassive = streams.filter(s => s.status === 'active').reduce((s, st) => s + Number(st.monthly_amount || 0), 0)

  return (
    <div>
      <SectionHeader title="Wealth Building" subtitle="Plant seeds for your abundant future">
        <Button onClick={() => setShowModal(true)} variant="gold">+ Add {tab === 'Investments' ? 'Investment' : 'Income Stream'}</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Invested', value: fmt(totalInvested), color: 'var(--brown-900)' },
              { label: 'Portfolio Value', value: fmt(totalValue), color: 'var(--brown-900)' },
              { label: 'Total Gain/Loss', value: fmt(totalGain), color: totalGain >= 0 ? '#065F46' : '#991B1B' },
              { label: 'Monthly Passive', value: fmt(monthlyPassive), color: 'var(--gold-dark)' },
            ].map(card => (
              <Card key={card.label} className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--brown-500)' }}>{card.label}</p>
                <p className="font-serif text-lg font-medium" style={{ color: card.color }}>{card.value}</p>
              </Card>
            ))}
          </div>

          <Tabs tabs={['Investments', 'Income Streams']} active={tab} onChange={setTab} />

          {tab === 'Investments' && (
            <>
              {investments.length === 0 ? (
                <EmptyState icon="📈" title="No investments tracked yet" description="Start tracking your investments to watch your wealth grow." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Investment</Button>} />
              ) : (
                <div className="space-y-3">
                  {investments.map(inv => {
                    const gain = Number(inv.current_value) - Number(inv.amount_invested)
                    const gainPct = Number(inv.amount_invested) > 0 ? (gain / Number(inv.amount_invested)) * 100 : 0
                    return (
                      <Card key={inv.id} className="p-4" goldHover>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium" style={{ color: 'var(--brown-900)' }}>{inv.name}</h3>
                              {inv.type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--brown-500)' }}>{inv.type}</span>}
                            </div>
                            {inv.account && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>Account: {inv.account}</p>}
                            {inv.notes && <p className="text-xs mt-1" style={{ color: 'var(--brown-500)' }}>{inv.notes}</p>}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium" style={{ color: 'var(--brown-900)' }}>{fmt(inv.current_value)}</p>
                            <p className="text-xs" style={{ color: gain >= 0 ? '#065F46' : '#991B1B' }}>
                              {gain >= 0 ? '+' : ''}{fmt(gain)} ({gainPct.toFixed(1)}%)
                            </p>
                            <button onClick={() => deleteInvestment(inv.id)} className="text-xs mt-1" style={{ color: 'var(--brown-300)' }}>Remove</button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'Income Streams' && (
            <>
              {streams.length === 0 ? (
                <EmptyState icon="💰" title="No income streams yet" description="Map out your active, passive, and side-hustle income." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Income Stream</Button>} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {streams.map(stream => (
                    <Card key={stream.id} className="p-5" goldHover>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--brown-900)' }}>{stream.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge status={stream.status} />
                            <span className="text-xs capitalize" style={{ color: 'var(--brown-500)' }}>{stream.type}</span>
                          </div>
                        </div>
                        {stream.monthly_amount && (
                          <p className="font-serif text-lg" style={{ color: 'var(--gold-dark)' }}>{fmt(stream.monthly_amount)}<span className="text-xs font-sans">/mo</span></p>
                        )}
                      </div>
                      {stream.description && <p className="text-xs mb-2" style={{ color: 'var(--brown-700)' }}>{stream.description}</p>}
                      {stream.next_steps && (
                        <div className="p-2.5 rounded-lg" style={{ background: 'var(--cream)' }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--brown-700)' }}>Next Steps</p>
                          <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{stream.next_steps}</p>
                        </div>
                      )}
                      <button onClick={() => deleteStream(stream.id)} className="text-xs mt-3" style={{ color: 'var(--brown-300)' }}>Remove</button>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'Investments' ? 'Add Investment' : 'Add Income Stream'}>
        {tab === 'Investments' ? (
          <div className="space-y-4">
            <Input label="Name" value={invForm.name} onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} placeholder="Fidelity S&P 500..." />
            <Select label="Type" value={invForm.type} onChange={e => setInvForm(f => ({ ...f, type: e.target.value }))} options={INVESTMENT_TYPES} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount Invested" type="number" value={invForm.amount_invested} onChange={e => setInvForm(f => ({ ...f, amount_invested: e.target.value }))} placeholder="1000" />
              <Input label="Current Value" type="number" value={invForm.current_value} onChange={e => setInvForm(f => ({ ...f, current_value: e.target.value }))} placeholder="1100" />
            </div>
            <Input label="Account" value={invForm.account} onChange={e => setInvForm(f => ({ ...f, account: e.target.value }))} placeholder="Robinhood, Fidelity..." />
            <Textarea label="Notes" value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addInvestment} variant="gold" disabled={saving} className="flex-1">Add Investment</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Income Stream Name" value={streamForm.name} onChange={e => setStreamForm(f => ({ ...f, name: e.target.value }))} placeholder="Online course, rental income..." />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type" value={streamForm.type} onChange={e => setStreamForm(f => ({ ...f, type: e.target.value }))} options={STREAM_TYPES} />
              <Select label="Status" value={streamForm.status} onChange={e => setStreamForm(f => ({ ...f, status: e.target.value }))} options={STREAM_STATUSES} />
            </div>
            <Input label="Monthly Amount" type="number" value={streamForm.monthly_amount} onChange={e => setStreamForm(f => ({ ...f, monthly_amount: e.target.value }))} placeholder="500" />
            <Textarea label="Description" value={streamForm.description} onChange={e => setStreamForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <Textarea label="Next Steps" value={streamForm.next_steps} onChange={e => setStreamForm(f => ({ ...f, next_steps: e.target.value }))} rows={2} />
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button onClick={addStream} variant="gold" disabled={saving} className="flex-1">Add Stream</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
