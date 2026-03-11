import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, SectionHeader, Button, Input, Textarea, Select, Modal, EmptyState, Spinner } from '../../components/ui'

const PLATFORMS = ['Instagram', 'Google', 'Facebook', 'Yelp', 'Word of mouth', 'Text', 'Email', 'Other']

export default function Testimonials({ session }) {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [form, setForm] = useState({ client_name: '', content: '', service: '', date: '', platform: '', is_featured: false })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('testimonials').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setTestimonials(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.client_name.trim() || !form.content.trim()) return
    setSaving(true)
    const { data } = await supabase.from('testimonials').insert({
      user_id: session.user.id,
      ...form,
      date: form.date || null,
    }).select().single()
    if (data) setTestimonials(prev => [data, ...prev])
    setForm({ client_name: '', content: '', service: '', date: '', platform: '', is_featured: false })
    setShowModal(false)
    setSaving(false)
  }

  async function toggleFeatured(testimonial) {
    const { data } = await supabase.from('testimonials').update({ is_featured: !testimonial.is_featured }).eq('id', testimonial.id).select().single()
    if (data) setTestimonials(prev => prev.map(t => t.id === data.id ? data : t))
  }

  async function deleteTestimonial(id) {
    await supabase.from('testimonials').delete().eq('id', id)
    setTestimonials(prev => prev.filter(t => t.id !== id))
  }

  const displayed = featuredOnly ? testimonials.filter(t => t.is_featured) : testimonials
  const featured = testimonials.filter(t => t.is_featured)

  return (
    <div>
      <SectionHeader title="Testimonials" subtitle="The beautiful words of those you've touched">
        <div className="flex gap-2">
          <button
            onClick={() => setFeaturedOnly(f => !f)}
            className="px-3 py-2 rounded-xl text-sm transition-all"
            style={{
              background: featuredOnly ? 'var(--gold)' : 'white',
              color: featuredOnly ? 'var(--brown-900)' : 'var(--brown-500)',
              border: '1px solid var(--brown-100)',
            }}
          >
            ✦ Featured ({featured.length})
          </button>
          <Button onClick={() => setShowModal(true)} variant="gold">+ Add Testimonial</Button>
        </div>
      </SectionHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
        displayed.length === 0 ? (
          <EmptyState
            icon="💬"
            title={featuredOnly ? 'No featured testimonials' : 'No testimonials yet'}
            description={featuredOnly ? 'Star your best testimonials to feature them.' : 'Add the kind words your clients have shared about your work.'}
            action={!featuredOnly && <Button onClick={() => setShowModal(true)} variant="gold">Add Testimonial</Button>}
          />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {displayed.map(t => (
              <div key={t.id} className="break-inside-avoid mb-5">
                <Card
                  className="p-5"
                  style={t.is_featured ? { border: '2px solid var(--gold)' } : {}}
                >
                  {t.is_featured && (
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs" style={{ color: 'var(--gold)' }}>✦</span>
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--gold)' }}>Featured</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--brown-700)' }}>
                    "{t.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--brown-900)' }}>— {t.client_name}</p>
                      {t.service && <p className="text-xs" style={{ color: 'var(--brown-500)' }}>{t.service}</p>}
                      {t.platform && <p className="text-xs" style={{ color: 'var(--brown-300)' }}>via {t.platform}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => toggleFeatured(t)}
                        className="text-xl transition-all"
                        style={{ color: t.is_featured ? 'var(--gold)' : 'var(--brown-100)' }}
                        title={t.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        ✦
                      </button>
                      <button onClick={() => deleteTestimonial(t.id)} className="text-xs" style={{ color: 'var(--brown-300)' }}>✕</button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Testimonial">
        <div className="space-y-4">
          <Input label="Client Name" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client's name" />
          <Textarea label="Their Words" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste or type their testimonial here..." rows={5} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Service" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="Balayage, coaching..." />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <Select label="Platform" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} options={PLATFORMS} />
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
              className="w-5 h-5 rounded flex items-center justify-center text-xs transition-all"
              style={{
                background: form.is_featured ? 'var(--gold)' : 'white',
                border: `1.5px solid ${form.is_featured ? 'var(--gold)' : 'var(--brown-200)'}`,
                color: form.is_featured ? 'var(--brown-900)' : 'transparent',
              }}
            >
              ✓
            </div>
            <span className="text-sm" style={{ color: 'var(--brown-700)' }}>Feature this testimonial</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={save} variant="gold" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Add Testimonial'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
