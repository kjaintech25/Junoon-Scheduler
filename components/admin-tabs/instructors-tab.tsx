'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Instructor = {
  id: string
  name: string
  email: string
  unique_token: string
  created_at: string
}

function generateToken() {
  return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6)
}

export function InstructorsTab() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '' })
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchInstructors() }, [])

  const fetchInstructors = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: true })
    setInstructors(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name || !form.email) return
    setAdding(true)
    const { error } = await supabase.from('instructors').insert([{
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      unique_token: generateToken(),
    }])
    if (!error) {
      setSuccessMsg(`${form.name} added!`)
      setForm({ name: '', email: '' })
      fetchInstructors()
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('instructors').delete().eq('id', id)
    if (!error) fetchInstructors()
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/book/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
          Instructors
        </h1>
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--driftwood)' }}>
          MANAGE INSTRUCTORS AND BOOKING LINKS
        </p>
      </div>

      <div className="flex gap-8">
        {/* Main — Instructor List */}
        <div className="flex-1">
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--linen)' }}>
              <h2 className="font-display text-xl font-light" style={{ color: 'var(--bark)' }}>
                All Instructors
              </h2>
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--driftwood)' }}>
                {instructors.length} total
              </span>
            </div>

            {loading ? (
              <p className="px-6 py-8 text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
            ) : instructors.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm mb-1" style={{ color: 'var(--driftwood)' }}>No instructors yet</p>
                <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Add one using the form</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--linen)' }}>
                    {['Name', 'Email', 'Booking Link', 'Added', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-mono text-[10px] tracking-widest uppercase"
                          style={{ color: 'var(--driftwood)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {instructors.map(instructor => {
                    const bookingLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${instructor.unique_token}`
                    return (
                      <tr key={instructor.id} className="border-b last:border-0 hover:bg-[#faf7f2] transition-colors"
                          style={{ borderColor: 'var(--linen)' }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                                 style={{ background: 'var(--ivory)', color: 'var(--clay)' }}>
                              {instructor.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--bark)' }}>
                              {instructor.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--soil)' }}>
                          {instructor.email}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => copyLink(instructor.unique_token)}
                            className="font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors hover:opacity-70 bg-transparent border-none cursor-pointer"
                            style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--driftwood)' }}>
                            {copiedId === instructor.unique_token ? 'Copied!' : 'Copy link'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--driftwood)' }}>
                          {new Date(instructor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleDelete(instructor.id)}
                            className="text-[10px] font-mono tracking-widest uppercase hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
                            style={{ color: 'var(--driftwood)' }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel — Add Form */}
        <aside className="w-80 shrink-0">
          <div className="rounded-lg border p-5 sticky top-24"
               style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
            <h3 className="font-display text-xl font-light mb-4" style={{ color: 'var(--bark)' }}>
              Add Instructor
            </h3>

            {successMsg && (
              <div className="mb-4 px-3 py-2 rounded-sm text-xs font-mono"
                   style={{ background: 'rgba(77,107,77,0.1)', color: 'var(--moss)' }}>
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>NAME</label>
                <input type="text" value={form.name} placeholder="Full name"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>EMAIL</label>
                <input type="email" value={form.email} placeholder="email@example.com"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
              </div>

              <button onClick={handleAdd} disabled={adding || !form.name || !form.email}
                className="w-full py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-40 hover:opacity-90 border-none cursor-pointer mt-2"
                style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                {adding ? 'Adding...' : 'ADD INSTRUCTOR'}
              </button>
            </div>

            <div className="mt-6 px-4 py-3 rounded-sm border" style={{ borderColor: 'var(--linen)', background: 'var(--cream)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--bark)' }}>
                HOW IT WORKS
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--driftwood)' }}>
                Each instructor gets a unique, secure booking link. Share it with them — they can use it to browse and claim available class slots. No login required.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
