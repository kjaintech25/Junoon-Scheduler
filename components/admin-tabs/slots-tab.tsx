'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed'
  stream_id: string | null
}

const DURATIONS = [30, 45, 60, 75, 90]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12
  const period = i < 12 ? 'AM' : 'PM'
  return { value: String(i).padStart(2, '0'), label: `${h}:00 ${period}` }
})

export function SlotsTab() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields (shared for create + edit)
  const [form, setForm] = useState({
    date: '',
    start_time: '',
    duration_minutes: '60',
    stream_id: '',
  })

  useEffect(() => { fetchSlots() }, [])

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase.from('slots').select('*').order('date', { ascending: true })
    setSlots(data || [])
    setLoading(false)
  }

  const handlePublish = async () => {
    if (!form.date || !form.start_time) return
    setPublishing(true)
    const minutes = parseInt(form.duration_minutes)
    const { error } = await supabase.from('slots').insert([{
      date: form.date,
      start_time: form.start_time,
      duration_hours: minutes / 60,
      status: 'open',
      stream_id: form.stream_id.trim() || null,
    }])
    if (!error) {
      setSuccessMsg('Slot published!')
      setForm({ date: '', start_time: '', duration_minutes: '60', stream_id: '' })
      fetchSlots()
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setPublishing(false)
  }

  const startEdit = (slot: Slot) => {
    setEditingId(slot.id)
    setForm({
      date: slot.date,
      start_time: slot.start_time,
      duration_minutes: String(slot.duration_hours * 60),
      stream_id: slot.stream_id || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ date: '', start_time: '', duration_minutes: '60', stream_id: '' })
  }

  const saveEdit = async () => {
    if (!editingId) return
    const minutes = parseInt(form.duration_minutes)
    const { error } = await supabase
      .from('slots')
      .update({
        date: form.date,
        start_time: form.start_time,
        duration_hours: minutes / 60,
        stream_id: form.stream_id.trim() || null,
      })
      .eq('id', editingId)
    if (!error) {
      setSuccessMsg('Slot updated!')
      setEditingId(null)
      setForm({ date: '', start_time: '', duration_minutes: '60', stream_id: '' })
      fetchSlots()
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('slots').delete().eq('id', id)
    if (!error) fetchSlots()
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  }

  const getDurationLabel = (hours: number) => {
    const minutes = hours * 60
    if (minutes < 60) return `${minutes}min`
    if (minutes === 60) return '1h'
    return `${minutes / 60}h`
  }

  // Group slots by date
  const groupedByDate: Record<string, Slot[]> = {}
  slots.forEach(slot => {
    if (!groupedByDate[slot.date]) groupedByDate[slot.date] = []
    groupedByDate[slot.date].push(slot)
  })

  const sortedDates = Object.keys(groupedByDate).sort()
  const isEditing = editingId !== null

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
          Slot Management
        </h1>
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--driftwood)' }}>
          CREATE AND MANAGE CLASS SLOTS
        </p>
      </div>

      <div className="flex gap-8">
        {/* Main — Slot List */}
        <div className="flex-1">
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading slots...</p>
          ) : sortedDates.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center"
                 style={{ borderColor: 'var(--linen)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--driftwood)' }}>No slots yet</p>
              <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Use the form to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map(date => (
                <div key={date} className="rounded-lg border overflow-hidden"
                     style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                  <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--linen)' }}>
                    <h3 className="font-display text-lg" style={{ color: 'var(--bark)' }}>{date}</h3>
                    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(196,114,74,0.1)', color: 'var(--clay)' }}>
                      {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'SLOT' : 'SLOTS'}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--linen)' }}>
                    {groupedByDate[date].map(slot => (
                      <div key={slot.id} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>TIME</p>
                            <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>
                              {formatTime(slot.start_time)}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>DURATION</p>
                            <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>
                              {getDurationLabel(slot.duration_hours)}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>STATUS</p>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              slot.status === 'open' ? 'bg-[#e8f4ec] text-[#4D6B4D]' :
                              slot.status === 'claimed' ? 'bg-[#fef5e4] text-[#8C5A0A]' :
                              'bg-[#eceef5] text-[#3D4A6B]'
                            }`}>
                              {slot.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEdit(slot)}
                            className="text-[10px] font-mono tracking-widest uppercase hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
                            style={{ color: 'var(--clay)' }}>
                            Edit
                          </button>
                          {slot.status === 'open' && (
                            <button onClick={() => handleDelete(slot.id)}
                              className="text-[10px] font-mono tracking-widest uppercase hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
                              style={{ color: 'var(--driftwood)' }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Create/Edit Slot Form */}
        <aside className="w-80 shrink-0">
          <div className="rounded-lg border p-5 sticky top-24"
               style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
            <h3 className="font-display text-xl font-light mb-4" style={{ color: 'var(--bark)' }}>
              {isEditing ? 'Edit Slot' : 'Create New Slot'}
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
                       style={{ color: 'var(--driftwood)' }}>DATE</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>START TIME</label>
                <select value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: form.start_time ? 'var(--bark)' : 'var(--driftwood)' }}>
                  <option value="" disabled>Select a time</option>
                  {HOURS.map(h => (
                    <option key={h.value} value={`${h.value}:00`}>{h.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>DURATION</label>
                <select value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                  {DURATIONS.map(m => (
                    <option key={m} value={m}>
                      {m} minute{m !== 60 ? '' : ''}{m === 60 ? ' (1 hour)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>STREAM ID <span style={{ opacity: 0.6 }}>(optional)</span></label>
                <input type="text" value={form.stream_id} placeholder="e.g. 2f0b755a..."
                  onChange={e => setForm(f => ({ ...f, stream_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
              </div>

              {isEditing ? (
                <>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit}
                      className="flex-1 py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity border border-[var(--linen)] bg-transparent cursor-pointer"
                      style={{ color: 'var(--driftwood)' }}>
                      Cancel
                    </button>
                    <button onClick={saveEdit}
                      className="flex-1 py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity border-none cursor-pointer"
                      style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={handlePublish} disabled={publishing || !form.date || !form.start_time}
                    className="w-full py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-40 hover:opacity-90 border-none cursor-pointer mt-2"
                    style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                    {publishing ? 'PUBLISHING...' : 'PUBLISH NEW SLOT'}
                  </button>
                </>
              )}

              <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--driftwood)' }}>
                {isEditing
                  ? 'Click Cancel to clear the form without making changes.'
                  : 'Publishing makes the slot visible to instructors immediately.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
