import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, EmptyState, Spinner, ProgressBar } from '../../components/ui'

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

function payoffMonths(balance, rate, payment) {
  if (!balance || !payment || payment <= 0) return null
  if (!rate) return Math.ceil(balance / payment)
  const monthlyRate = rate / 100 / 12
  if (payment <= balance * monthlyRate) return Infinity
  return Math.ceil(Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate))
}

export default function DebtTracker({ session }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDebt, setEditDebt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', lender: '', original_amount: '', current_balance: '',
    interest_rate: '', min_payment: '', due_date: '', strategy: '', target_payoff: '', notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('debts').select('*').eq('user_id', session.user.id).eq('is_paid_off', false).order('current_balance', { ascending: false })
    setDebts(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditDebt(null)
    setForm({ name: '', lender: '', original_amount: '', current_balance: '', interest_rate: '', min_payment: '', due_date: '', strategy: '', target_payoff: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(debt) {
    setEditDebt(debt)
    setForm({ ...debt, original_amount: String(debt.original_amount), current_balance: String(debt.current_balance), interest_rate: String(debt.interest_rate || ''), min_payment: String(debt.min_payment || ''), due_date: String(debt.due_date || ''), target_payoff: debt.target_payoff || '' })
    setShowModal(true)
  }

  async function save() {
    if (!form.name || !form.current_balance) return
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      name: form.name,
      lender: form.lender,
      original_amount: parseFloat(form.original_amount || form.current_balance),
      current_balance: parseFloat(form.current_balance),
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
      min_payment: form.min_payment ? parseFloat(form.min_payment) : null,
      due_date: form.due_date ? parseInt(form.due_date) : null,
      strategy: form.strategy,
      target_payoff: form.target_payoff || null,
      notes: form.notes,
    }
    if (editDebt) {
      const { data } = await supabase.from('debts').update(payload).eq('id', editDebt.id).select().single()
      if (data) setDebts(prev => prev.map(d => d.id === data.id ? data : d))
    } else {
      const { data } = await supabase.from('debts').insert(payload).select().single()
      if (data) setDebts(prev => [data, ...prev])
    }
    setShowModal(false)
    setSaving(false)
  }

  async function markPaidOff(id) {
    await supabase.from('debts').update({ is_paid_off: true }).eq('id', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  async function deleteDebt(id) {
    await supabase.from('debts').delete().eq('id', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  const totalDebt = debts.reduce((s, d) => s + Number(d.current_balance), 0)
  const totalOriginal = debts.reduce((s, d) => s + Number(d.original_amount), 0)
  const totalPaid = totalOriginal - totalDebt
  const overallPct = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0

  return (
    <div>
      <SectionHeader title="Debt Payoff" subtitle="Every payment brings you closer to freedom">
        <Button onClick={openAdd} variant="gold">+ Add Debt</Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {debts.length > 0 && (
            <Card className="p-5 mb-6">
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--brown-500)' }}>Total Remaining</p>
                  <p className="font-serif text-2xl font-medium" style={{ color: '#991B1B' }}>{fmt(totalDebt)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--brown-500)' }}>Total Paid Off</p>
                  <p className="font-serif text-2xl font-medium" style={{ color: '#065F46' }}>{fmt(totalPaid)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--brown-500)' }}>Overall Progress</p>
                  <p className="font-serif text-2xl font-medium" style={{ color: 'var(--gold-dark)' }}>{overallPct.toFixed(1)}%</p>
                </div>
              </div>
              <ProgressBar value={totalPaid} max={totalOriginal} color="var(--gold)" />
            </Card>
          )}

          {debts.length === 0 ? (
            <EmptyState
              icon="🌟"
              title="No debts tracked"
              description="Track your debts to see your path to financial freedom."
              action={<Button onClick={openAdd} variant="gold">Add Your First Debt</Button>}
            />
          ) : (
            <div className="space-y-4">
              {debts.map(debt => {
                const paid = Number(debt.original_amount) - Number(debt.current_balance)
                const pct = Number(debt.original_amount) > 0 ? (paid / Number(debt.original_amount)) * 100 : 0
                const months = payoffMonths(Number(debt.current_balance), Number(debt.interest_rate), Number(debt.min_payment))
                return (
                  <Card key={debt.id} className="p-5" goldHover>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-base" style={{ color: 'var(--brown-900)' }}>{debt.name}</h3>
                        {debt.lender && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{debt.lender}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-xl font-medium" style={{ color: '#991B1B' }}>{fmt(debt.current_balance)}</p>
                        <p className="text-xs" style={{ color: 'var(--brown-500)' }}>of {fmt(debt.original_amount)}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: 'var(--brown-500)' }}>{pct.toFixed(1)}% paid off</span>
                        <span className="text-xs" style={{ color: '#065F46' }}>{fmt(paid)} paid</span>
                      </div>
                      <ProgressBar value={paid} max={Number(debt.original_amount)} color="var(--gold)" />
                    </div>

                    <div className="flex items-center gap-4 text-xs flex-wrap mb-3" style={{ color: 'var(--brown-500)' }}>
                      {debt.interest_rate && <span>APR: {debt.interest_rate}%</span>}
                      {debt.min_payment && <span>Min: {fmt(debt.min_payment)}/mo</span>}
                      {debt.due_date && <span>Due: {debt.due_date}th</span>}
                      {months && months !== Infinity && <span style={{ color: 'var(--gold-dark)' }}>~{months} months to payoff</span>}
                    </div>

                    {debt.notes && <p className="text-xs mb-3" style={{ color: 'var(--brown-500)' }}>{debt.notes}</p>}

                    <div className="flex gap-2">
                      <Button onClick={() => openEdit(debt)} variant="secondary" size="sm">Edit</Button>
                      <Button onClick={() => markPaidOff(debt.id)} variant="gold" size="sm">Mark Paid Off 🎉</Button>
                      <Button onClick={() => deleteDebt(debt.id)} variant="danger" size="sm">Delete</Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editDebt ? 'Edit Debt' : 'Add Debt'}>
        <div className="space-y-4">
          <Input label="Debt Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student loan, credit card..." />
          <Input label="Lender" value={form.lender} onChange={e => setForm(f => ({ ...f, lender: e.target.value }))} placeholder="Bank name..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Original Amount" type="number" value={form.original_amount} onChange={e => setForm(f => ({ ...f, original_amount: e.target.value }))} placeholder="5000" />
            <Input label="Current Balance" type="number" value={form.current_balance} onChange={e => setForm(f => ({ ...f, current_balance: e.target.value }))} placeholder="3200" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Interest Rate %" type="number" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="18.99" />
            <Input label="Min Payment" type="number" value={form.min_payment} onChange={e => setForm(f => ({ ...f, min_payment: e.target.value }))} placeholder="50" />
            <Input label="Due Day" type="number" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} placeholder="15" />
          </div>
          <Input label="Target Payoff Date" type="date" value={form.target_payoff} onChange={e => setForm(f => ({ ...f, target_payoff: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Strategy, extra payments..." rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
