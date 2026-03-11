import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, EmptyState, Spinner } from '../../components/ui'

const SERVICE_CATEGORIES = ['Cut & Style', 'Color', 'Treatment', 'Natural', 'Extensions', 'Braids', 'Other']

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

export default function HairBusiness({ session }) {
  const [services, setServices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState(null)
  const [saving, setSaving] = useState(false)
  const [calculatorSelected, setCalculatorSelected] = useState([])
  const [form, setForm] = useState({ name: '', category: '', price: '', duration_min: '', description: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', session.user.id).eq('is_active', true).order('category'),
      supabase.from('hair_clients').select('name, referred_by').eq('user_id', session.user.id).eq('is_active', true),
    ])
    setServices(s || [])
    setClients(c || [])
    setLoading(false)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      user_id: session.user.id,
      name: form.name,
      category: form.category,
      price: form.price ? parseFloat(form.price) : null,
      duration_min: form.duration_min ? parseInt(form.duration_min) : null,
      description: form.description,
    }
    if (editService) {
      const { data } = await supabase.from('services').update(payload).eq('id', editService.id).select().single()
      if (data) setServices(prev => prev.map(s => s.id === data.id ? data : s))
    } else {
      const { data } = await supabase.from('services').insert(payload).select().single()
      if (data) setServices(prev => [...prev, data])
    }
    setForm({ name: '', category: '', price: '', duration_min: '', description: '' })
    setEditService(null)
    setShowModal(false)
    setSaving(false)
  }

  async function deleteService(id) {
    await supabase.from('services').update({ is_active: false }).eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  function openEdit(svc) {
    setEditService(svc)
    setForm({ name: svc.name, category: svc.category || '', price: String(svc.price || ''), duration_min: String(svc.duration_min || ''), description: svc.description || '' })
    setShowModal(true)
  }

  function toggleCalc(svc) {
    setCalculatorSelected(prev =>
      prev.some(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc]
    )
  }

  const calcTotal = calculatorSelected.reduce((s, svc) => s + Number(svc.price || 0), 0)
  const calcTime = calculatorSelected.reduce((s, svc) => s + Number(svc.duration_min || 0), 0)

  const byCategory = SERVICE_CATEGORIES.reduce((acc, cat) => {
    const catServices = services.filter(s => s.category === cat)
    if (catServices.length > 0) acc[cat] = catServices
    return acc
  }, {})
  const uncategorized = services.filter(s => !s.category || !SERVICE_CATEGORIES.includes(s.category))
  if (uncategorized.length) byCategory['Other'] = uncategorized

  // Referral stats
  const referralCounts = clients.reduce((acc, c) => {
    if (c.referred_by) acc[c.referred_by] = (acc[c.referred_by] || 0) + 1
    return acc
  }, {})
  const topReferrals = Object.entries(referralCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div>
      <SectionHeader title="Hair Business" subtitle="Your service menu & business overview">
        <Button onClick={() => { setEditService(null); setForm({ name: '', category: '', price: '', duration_min: '', description: '' }); setShowModal(true) }} variant="gold">
          + Add Service
        </Button>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Service Menu */}
            <Card className="p-5">
              <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--brown-900)' }}>Service Menu</h2>
              {services.length === 0 ? (
                <EmptyState icon="✂️" title="No services yet" description="Add your service menu to keep track of your offerings." action={<Button onClick={() => setShowModal(true)} variant="gold">Add Service</Button>} />
              ) : (
                <div className="space-y-5">
                  {Object.entries(byCategory).map(([cat, svcs]) => (
                    <div key={cat}>
                      <h3 className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--gold)' }}>{cat}</h3>
                      <div className="space-y-2">
                        {svcs.map(svc => (
                          <div key={svc.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)' }}>
                            <button
                              onClick={() => toggleCalc(svc)}
                              className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 transition-all"
                              style={{
                                background: calculatorSelected.some(s => s.id === svc.id) ? 'var(--gold)' : 'white',
                                border: '1.5px solid var(--brown-200)',
                                color: calculatorSelected.some(s => s.id === svc.id) ? 'var(--brown-900)' : 'transparent',
                              }}
                            >
                              ✓
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{svc.name}</p>
                              {svc.description && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{svc.description}</p>}
                            </div>
                            <div className="text-right">
                              {svc.price && <p className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>{fmt(svc.price)}</p>}
                              {svc.duration_min && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{svc.duration_min}min</p>}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(svc)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--brown-500)' }}>Edit</button>
                              <button onClick={() => deleteService(svc.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--brown-300)' }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Pricing Calculator */}
            {calculatorSelected.length > 0 && (
              <Card className="p-5" style={{ border: '2px solid var(--gold)' }}>
                <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Pricing Calculator</h2>
                <div className="space-y-2 mb-4">
                  {calculatorSelected.map(svc => (
                    <div key={svc.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--brown-700)' }}>{svc.name}</span>
                      <span style={{ color: 'var(--brown-900)' }}>{fmt(svc.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--brown-100)' }}>
                  <div className="flex justify-between font-medium">
                    <span style={{ color: 'var(--brown-700)' }}>Total</span>
                    <span className="font-serif text-lg" style={{ color: 'var(--gold-dark)' }}>{fmt(calcTotal)}</span>
                  </div>
                  {calcTime > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--brown-500)' }}>Estimated time: {calcTime} min</p>
                  )}
                </div>
                <button onClick={() => setCalculatorSelected([])} className="text-xs mt-3" style={{ color: 'var(--brown-300)' }}>Clear selection</button>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Total services</span>
                  <span className="font-medium" style={{ color: 'var(--brown-900)' }}>{services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Active clients</span>
                  <span className="font-medium" style={{ color: 'var(--brown-900)' }}>{clients.length}</span>
                </div>
                {services.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Avg service price</span>
                    <span className="font-medium" style={{ color: 'var(--brown-900)' }}>
                      {fmt(services.filter(s => s.price).reduce((sum, s) => sum + Number(s.price), 0) / services.filter(s => s.price).length)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {topReferrals.length > 0 && (
              <Card className="p-5">
                <h2 className="font-serif text-base mb-4" style={{ color: 'var(--brown-900)' }}>Top Referral Sources</h2>
                <div className="space-y-2">
                  {topReferrals.map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-sm truncate" style={{ color: 'var(--brown-700)' }}>{source}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        {count} {count === 1 ? 'client' : 'clients'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editService ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4">
          <Input label="Service Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Balayage, Silk press..." />
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={SERVICE_CATEGORIES} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
            <Input label="Duration (min)" type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} placeholder="90" />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Service'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
