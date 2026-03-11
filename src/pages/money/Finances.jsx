import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Select, Spinner, EmptyState } from '../../components/ui'

const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Health', 'Beauty', 'Entertainment', 'Business', 'Savings', 'Other']
const INCOME_CATEGORIES = ['Hair Services', 'Tips', 'Coaching', 'Digital', 'Other Income']

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (m) => {
  const [y, mo] = m.split('-')
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Finances({ session }) {
  const [month, setMonth] = useState(currentMonth())
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState({ type: 'expense', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const [addBudget, setAddBudget] = useState({ category: '', amount: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [month])

  async function load() {
    setLoading(true)
    const [y, m] = month.split('-')
    const start = `${month}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const end = `${month}-${lastDay}`

    const [{ data: txns }, { data: buds }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', session.user.id).gte('date', start).lte('date', end).order('date', { ascending: false }),
      supabase.from('budget_items').select('*').eq('user_id', session.user.id).eq('month_year', month),
    ])
    setTransactions(txns || [])
    setBudgets(buds || [])
    setLoading(false)
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expenses
  const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : 0

  const expenseByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0)
    return acc
  }, {})

  async function quickAdd() {
    if (!addForm.category || !addForm.amount) return
    setSaving(true)
    const { data } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      ...addForm,
      amount: parseFloat(addForm.amount),
    }).select().single()
    if (data) setTransactions(prev => [data, ...prev])
    setAddForm(f => ({ ...f, amount: '', description: '' }))
    setSaving(false)
  }

  async function addBudgetItem() {
    if (!addBudget.category || !addBudget.amount) return
    const { data } = await supabase.from('budget_items').upsert({
      user_id: session.user.id,
      month_year: month,
      category: addBudget.category,
      budgeted_amount: parseFloat(addBudget.amount),
    }, { onConflict: 'user_id,month_year,category' }).select().single()
    if (data) setBudgets(prev => {
      const filtered = prev.filter(b => b.category !== data.category)
      return [...filtered, data]
    })
    setAddBudget({ category: '', amount: '' })
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      <SectionHeader title="Finances & Budget" subtitle="Build your wealth with clarity and intention">
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'white', border: '1.5px solid var(--brown-100)', color: 'var(--brown-700)' }}
        />
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Income', value: fmt(income), color: '#065F46', bg: '#D1FAE5' },
              { label: 'Expenses', value: fmt(expenses), color: '#991B1B', bg: '#FEE2E2' },
              { label: 'Net', value: fmt(net), color: net >= 0 ? '#065F46' : '#991B1B', bg: net >= 0 ? '#D1FAE5' : '#FEE2E2' },
              { label: 'Savings Rate', value: `${savingsRate}%`, color: 'var(--gold-dark)', bg: '#FEF3C7' },
            ].map(card => (
              <Card key={card.label} className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--brown-500)' }}>{card.label}</p>
                <p className="font-serif text-xl font-medium" style={{ color: card.color }}>{card.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Add */}
            <Card className="p-5">
              <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Quick Add Transaction</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['expense', 'income'].map(type => (
                    <button
                      key={type}
                      onClick={() => setAddForm(f => ({ ...f, type, category: '' }))}
                      className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                      style={{
                        background: addForm.type === type ? (type === 'income' ? '#D1FAE5' : '#FEE2E2') : 'var(--cream)',
                        color: addForm.type === type ? (type === 'income' ? '#065F46' : '#991B1B') : 'var(--brown-500)',
                        border: '1.5px solid var(--brown-100)',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <Select
                  value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                  options={addForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES}
                  placeholder="Category"
                />
                <Input value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" />
                <Input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                <Input value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} type="date" />
                <Button onClick={quickAdd} variant="gold" disabled={saving} className="w-full">
                  {saving ? 'Adding...' : 'Add Transaction'}
                </Button>
              </div>
            </Card>

            {/* Budget */}
            <Card className="p-5">
              <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Budget Tracker</h2>
              <div className="space-y-2 mb-4">
                {budgets.map(b => {
                  const spent = expenseByCategory[b.category] || 0
                  const pct = b.budgeted_amount > 0 ? Math.min(100, (spent / b.budgeted_amount) * 100) : 0
                  const over = spent > b.budgeted_amount
                  return (
                    <div key={b.id} className="p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm" style={{ color: 'var(--brown-700)' }}>{b.category}</span>
                        <span className="text-xs" style={{ color: over ? '#991B1B' : 'var(--brown-500)' }}>
                          {fmt(spent)} / {fmt(b.budgeted_amount)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--brown-100)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#EF4444' : 'var(--gold)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Select
                  value={addBudget.category}
                  onChange={e => setAddBudget(b => ({ ...b, category: e.target.value }))}
                  options={EXPENSE_CATEGORIES}
                  placeholder="Category"
                  className="flex-1"
                />
                <Input value={addBudget.amount} onChange={e => setAddBudget(b => ({ ...b, amount: e.target.value }))} placeholder="Budget $" type="number" className="w-28" />
                <Button onClick={addBudgetItem} variant="secondary" size="sm">Add</Button>
              </div>
            </Card>
          </div>

          {/* Transactions list */}
          <Card className="mt-6 p-5">
            <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Transactions — {monthLabel(month)}</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--brown-300)' }}>No transactions this month</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.type === 'income' ? '#D1FAE5' : '#FEE2E2', color: t.type === 'income' ? '#065F46' : '#991B1B' }}>{t.category}</span>
                        <span className="text-xs" style={{ color: 'var(--brown-300)' }}>{t.date}</span>
                      </div>
                      {t.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--brown-500)' }}>{t.description}</p>}
                    </div>
                    <span className="font-medium text-sm flex-shrink-0" style={{ color: t.type === 'income' ? '#065F46' : 'var(--brown-900)' }}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-xs flex-shrink-0" style={{ color: 'var(--brown-300)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
