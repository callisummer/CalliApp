import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Select, Spinner, EmptyState } from '../../components/ui'

const CATEGORIES = ['Housing', 'Food', 'Transport', 'Health', 'Beauty', 'Entertainment', 'Business', 'Savings', 'Other']
const PAYMENT_METHODS = ['Cash', 'Debit', 'Credit Card', 'Venmo', 'Zelle', 'Other']

const CAT_COLORS = {
  Housing: '#1E40AF', Food: '#065F46', Transport: '#92400E', Health: '#9D174D',
  Beauty: '#5B21B6', Entertainment: '#C2410C', Business: '#1E3A5F', Savings: '#065F46', Other: '#6B7280',
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ExpenseTracker({ session }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth())
  const [catFilter, setCatFilter] = useState('All')
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    amount: '',
    description: '',
    payment_method: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [month])

  async function load() {
    setLoading(true)
    const [y, m] = month.split('-')
    const lastDay = new Date(y, m, 0).getDate()
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', 'expense')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-${lastDay}`)
      .order('date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  async function addExpense() {
    if (!form.category || !form.amount) return
    setSaving(true)
    const { data } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      type: 'expense',
      date: form.date,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      payment_method: form.payment_method,
    }).select().single()
    if (data) setExpenses(prev => [data, ...prev])
    setForm(f => ({ ...f, amount: '', description: '' }))
    setSaving(false)
  }

  async function deleteExpense(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const filtered = catFilter === 'All' ? expenses : expenses.filter(e => e.category === catFilter)
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
    return acc
  }, {})

  return (
    <div>
      <SectionHeader title="Expense Tracker" subtitle="Track every dollar with intention">
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'white', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}
        />
      </SectionHeader>

      {/* Add form */}
      <Card className="p-5 mb-6">
        <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Add Expense</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" />
          <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} placeholder="Category" />
          <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" />
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
          <Button onClick={addExpense} variant="gold" disabled={saving || !form.category || !form.amount}>
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category totals */}
        <Card className="p-5">
          <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>
            By Category
            <span className="ml-2 text-sm font-normal" style={{ color: 'var(--brown-500)' }}>{fmt(total)}</span>
          </h2>
          <div className="space-y-2">
            {CATEGORIES.filter(cat => categoryTotals[cat] > 0).sort((a, b) => categoryTotals[b] - categoryTotals[a]).map(cat => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setCatFilter(catFilter === cat ? 'All' : cat)}
                    className="text-sm transition-all"
                    style={{ color: catFilter === cat ? 'var(--brown-900)' : 'var(--brown-500)', fontWeight: catFilter === cat ? 600 : 400 }}
                  >
                    {cat}
                  </button>
                  <span className="text-sm" style={{ color: 'var(--brown-700)' }}>{fmt(categoryTotals[cat])}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--brown-100)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total > 0 ? (categoryTotals[cat] / total) * 100 : 0}%`,
                      background: `${CAT_COLORS[cat]}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {catFilter !== 'All' && (
            <button onClick={() => setCatFilter('All')} className="text-xs mt-3" style={{ color: 'var(--gold)' }}>
              Show all
            </button>
          )}
        </Card>

        {/* Expense list */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-base" style={{ color: 'var(--brown-900)' }}>
                {catFilter === 'All' ? 'All Expenses' : catFilter}
              </h2>
              <span className="text-sm font-medium" style={{ color: 'var(--brown-700)' }}>
                {fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))}
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon="💸" title="No expenses" description={catFilter === 'All' ? 'No expenses this month yet.' : `No ${catFilter} expenses.`} />
            ) : (
              <div className="space-y-2">
                {filtered.map(expense => (
                  <div key={expense.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CAT_COLORS[expense.category] || '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--brown-500)' }}>{expense.date}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--brown-100)', color: 'var(--brown-500)' }}>{expense.category}</span>
                      </div>
                      {expense.description && <p className="text-sm truncate" style={{ color: 'var(--brown-700)' }}>{expense.description}</p>}
                    </div>
                    <span className="font-medium text-sm flex-shrink-0" style={{ color: 'var(--brown-900)' }}>
                      {fmt(expense.amount)}
                    </span>
                    <button onClick={() => deleteExpense(expense.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
