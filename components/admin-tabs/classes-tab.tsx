'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Instructor = {
  id: string
  name: string
  email: string
}

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed' | 'rejected'
  instructor_id: string | null
  stream_id: string | null
  class_type?: string
  image_url?: string | null
  is_published?: boolean
  instructor?: Instructor | null
}

type WaitlistEntry = {
  id: string
  slot_id: string
  instructor_id: string
  signed_up_at: string
  instructor?: Instructor | null
}

type ClassRecord = {
  id: string
  slot_id: string
  instructor_id: string
  class_title: string
  confirmed_at: string
  instructor?: Instructor | null
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  open:      { label: 'OPEN', color: '#4D6B4D', bg: 'rgba(77,107,77,0.1)' },
  claimed:   { label: 'WAITLISTED', color: '#8C5A0A', bg: 'rgba(140,90,10,0.1)' },
  confirmed: { label: 'CONFIRMED', color: '#3D4A6B', bg: 'rgba(61,74,107,0.1)' },
  rejected:  { label: 'REJECTED', color: '#8C3A18', bg: 'rgba(140,58,24,0.1)' },
}

const DURATIONS = [30, 45, 60, 75, 90]
const CLASS_TYPES = ['Vinyasa', 'Hatha', 'Power', 'Yin', 'Restorative', 'Kundalini', 'Other']

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const DEFAULT_FORM = {
  date: '',
  start_time: '',
  duration_minutes: '60',
  status: 'open',
  stream_id: '',
  class_type: 'Vinyasa',
  image_url: '',
  is_published: 'true',
}

export function ClassesTab() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [streamInput, setStreamInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [editingInstructor, setInstructorSelector] = useState<string>('')
  const [filter, setFilter] = useState<string>('all')
  const [classRecords, setClassRecords] = useState<ClassRecord[]>([])
  const [slotWaitlistCounts, setSlotWaitlistCounts] = useState<Record<string, number>>({})
  const [selectedWaitlistEntries, setSelectedWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([])

  useEffect(() => { fetchSlots(); fetchAllInstructors() }, [])

  const fetchAllInstructors = async () => {
    const { data } = await supabase
      .from('instructors')
      .select('*')
      .order('name', { ascending: true })
    setAllInstructors(data || [])
  }

  const fetchSlots = async () => {
    setLoading(true)

    // Fetch all slots
    const { data: slotData } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
    setSlots((slotData || []) as Slot[])

    // Fetch waitlist counts per slot
    const { data: wlData } = await supabase
      .from('waitlist')
      .select('slot_id')
    const counts: Record<string, number> = {}
    for (const entry of wlData || []) {
      counts[entry.slot_id] = (counts[entry.slot_id] || 0) + 1
    }
    setSlotWaitlistCounts(counts)

    // Fetch class records with instructor join
    const { data: clsData } = await supabase
      .from('classes')
      .select('*, instructor:instructors(name, email)')
      .order('confirmed_at', { ascending: false })
    setClassRecords((clsData || []) as ClassRecord[])

    setLoading(false)
  }

  const getWaitlistForSlot = async (slotId: string): Promise<WaitlistEntry[]> => {
    const { data } = await supabase
      .from('waitlist')
      .select('*, instructor:instructors(id, name, email)')
      .eq('slot_id', slotId)
      .order('signed_up_at', { ascending: true })
    return (data || []) as WaitlistEntry[]
  }

  const handleSelect = async (slot: Slot) => {
    setSelected(slot)
    setStreamInput(slot.stream_id || '')
    setEditingId(null)
    setCreating(false)
    setSaveMsg('')

    // Fetch waitlist entries for this slot
    if (slot.status === 'claimed') {
      const entries = await getWaitlistForSlot(slot.id)
      setSelectedWaitlistEntries(entries)
    } else if (slot.status === 'confirmed') {
      setSelectedWaitlistEntries([])
    } else {
      setSelectedWaitlistEntries([])
    }
  }

  const handleLinkStream = async () => {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase
      .from('slots')
      .update({ stream_id: streamInput.trim() || null })
      .eq('id', selected.id)
    if (!error) {
      const updated = { ...selected, stream_id: streamInput.trim() || null }
      setSelected(updated)
      setSlots(prev => prev.map(s => s.id === selected.id ? updated : s))
      setSaveMsg('Stream linked!')
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  const handleAcceptWaitlist = async (entry: WaitlistEntry) => {
    if (!selected) return
    setSaving(true)

    const slot = selected

    // 1. Create class record
    await supabase.from('classes').insert([{
      slot_id: slot.id,
      instructor_id: entry.instructor_id,
      class_title: `${slot.class_type || 'Vinyasa'} Class`,
    }])

    // 2. Flip slot to confirmed
    await supabase.from('slots').update({ status: 'confirmed' }).eq('id', slot.id)

    // 3. Update local state (keep other instructors on waitlist)
    const updated = { ...slot, status: 'confirmed' as const }
    setSelected(updated)
    setSlots(prev => prev.map(s => s.id === slot.id ? updated : s))
    await fetchSlots()
    setSaveMsg(`${entry.instructor?.name || 'Instructor'} confirmed!`)
    setTimeout(() => setSaveMsg(''), 3000)

    // Sync to website (server-side, fire-and-forget)
    try {
      await fetch('/api/confirm-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id }),
      })
    } catch (err) {
      console.error('Website sync failed:', err)
    }
    setSaving(false)
  }

  const handleRejectWaitlist = async (entry: WaitlistEntry) => {
    if (!selected) return
    setSaving(true)

    // 1. Delete this waitlist entry
    await supabase.from('waitlist').delete().eq('id', entry.id)

    // 2. Check if any waitlist entries remain
    const { data: remaining } = await supabase
      .from('waitlist')
      .select('id')
      .eq('slot_id', selected.id)
    const hasRemaining = remaining && remaining.length > 0

    // 3. If none remain, flip slot back to open
    if (!hasRemaining) {
      await supabase.from('slots').update({ status: 'open', instructor_id: null }).eq('id', selected.id)
    }

    // 4. Update local state
    const updatedSlots = selectedWaitlistEntries.filter(e => e.id !== entry.id)
    setSelectedWaitlistEntries(updatedSlots)
    setSlotWaitlistCounts(prev => ({ ...prev, [selected.id]: updatedSlots.length }))

    if (!hasRemaining) {
      const updatedSlot = { ...selected, status: 'open' as const, instructor_id: null }
      setSelected(updatedSlot)
      setSlots(prev => prev.map(s => s.id === selected.id ? updatedSlot : s))
    } else {
      fetchSlots()
    }

    setSaveMsg(`${entry.instructor?.name || 'Instructor'} removed from waitlist.`)
    setTimeout(() => setSaveMsg(''), 3000)

    setSaving(false)
  }

  const startEdit = (slot: Slot) => {
    setSelected(slot)
    setEditingId(slot.id)
    setCreating(false)
    setInstructorSelector('')
    setForm({
      date: slot.date,
      start_time: slot.start_time,
      duration_minutes: String(slot.duration_hours * 60),
      status: slot.status,
      stream_id: slot.stream_id || '',
      class_type: (slot.class_type || 'Vinyasa'),
      image_url: slot.image_url || '',
      is_published: slot.is_published ? 'true' : 'false',
    })
    setSaveMsg('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setInstructorSelector('')
    setForm({ ...DEFAULT_FORM })
  }

  const startCreate = () => {
    setCreating(true)
    setSelected(null)
    setEditingId(null)
    setForm({ ...DEFAULT_FORM })
    setSaveMsg('')
  }

  const cancelCreate = () => {
    setCreating(false)
    setForm({ ...DEFAULT_FORM })
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
        status: form.status,
        stream_id: form.stream_id.trim() || null,
        class_type: form.class_type,
        instructor_id: editingInstructor || null,
        image_url: form.image_url.trim() || null,
        is_published: form.is_published === 'true',
      })
      .eq('id', editingId)
    if (!error) {
      const updated = {
        id: editingId,
        date: form.date,
        start_time: form.start_time,
        duration_hours: minutes / 60,
        status: form.status as Slot['status'],
        instructor_id: editingInstructor || null,
        stream_id: form.stream_id.trim() || null,
        class_type: form.class_type,
        image_url: form.image_url.trim() || null,
        is_published: form.is_published === 'true',
      }
      setSelected(updated)
      setSlots(prev => prev.map(s => s.id === editingId ? updated : s))
      setEditingId(null)
      setSaveMsg('Class updated!')
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  const handleCreate = async () => {
    if (!form.date || !form.start_time) return
    setSaving(true)
    const minutes = parseInt(form.duration_minutes)
    const { error } = await supabase.from('slots').insert([{
      date: form.date,
      start_time: form.start_time,
      duration_hours: minutes / 60,
      status: form.status,
      stream_id: form.stream_id.trim() || null,
      class_type: form.class_type,
      image_url: form.image_url.trim() || null,
      is_published: form.is_published === 'true',
    }])
    if (!error) {
      setSaveMsg('Class created!')
      setCreating(false)
      setForm({ ...DEFAULT_FORM })
      fetchSlots()
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  const getConfirmedInstructor = (slotId: string) => {
    return classRecords.find(c => c.slot_id === slotId)?.instructor || null
  }

  const statusFilter = filter === 'all' ? undefined : filter
  const displaySlots = statusFilter
    ? slots.filter(s => s.status === statusFilter)
    : slots

  // Find confirmed slot's instructor for display
  const confirmedInstructor = selected?.status === 'confirmed' ? getConfirmedInstructor(selected.id) : null

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
            Classes
          </h1>
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--driftwood)' }}>
            MANAGE ALL CLASSES, SLOTS, AND STREAMS
          </p>
        </div>
        <button onClick={startCreate}
          className="px-4 py-2 text-sm font-medium rounded-sm transition-opacity hover:opacity-90 border-none cursor-pointer"
          style={{ background: 'var(--clay)', color: 'var(--white)' }}>
          + Create New Slot
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'open', 'claimed', 'confirmed', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-opacity border-none cursor-pointer"
            style={{
              background: filter === f ? 'var(--clay)' : 'var(--white)',
              color: filter === f ? 'var(--white)' : 'var(--driftwood)',
              border: filter === f ? 'none' : '1px solid var(--linen)',
            }}>
            {f === 'all' ? 'All' : f}
            {f !== 'all' && (
              <span className="ml-1.5" style={{ opacity: 0.6 }}>
                ({slots.filter(s => s.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Left — Class List */}
        <div className="w-80 shrink-0">
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
          ) : displaySlots.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center"
                 style={{ borderColor: 'var(--linen)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--driftwood)' }}>
                {filter === 'all' ? 'No classes yet' : `No ${filter} classes`}
              </p>
              <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Create one to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displaySlots.map(slot => {
                const s = STATUS_STYLES[slot.status]
                const isSelected = selected?.id === slot.id
                const wlCount = slotWaitlistCounts[slot.id] || 0
                const confInstructor = getConfirmedInstructor(slot.id)
                return (
                  <button key={slot.id} onClick={() => handleSelect(slot)}
                    className="w-full text-left px-4 py-3 rounded-sm transition-colors hover:opacity-80 bg-transparent border-none cursor-pointer"
                    style={{
                      background: isSelected ? 'var(--ivory)' : 'var(--white)',
                      borderLeft: isSelected ? '3px solid var(--clay)' : '3px solid transparent',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{slot.date}</p>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                            style={{ color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--driftwood)' }}>
                      {formatTime(slot.start_time)} · {formatDurationLabel(slot.duration_hours)}
                    </p>
                    {slot.class_type && slot.class_type !== 'Vinyasa' && (
                      <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--clay)' }}>
                        {slot.class_type}
                      </p>
                    )}
                    {/* Waitlist count for claimed slots */}
                    {slot.status === 'claimed' && wlCount > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(140,90,10,0.1)', color: '#8C5A0A' }}>
                          {wlCount} instructor{wlCount > 1 ? 's' : ''} on waitlist
                        </span>
                      </div>
                    )}
                    {/* Confirmed instructor */}
                    {slot.status === 'confirmed' && confInstructor && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
                             style={{ background: 'rgba(77,107,77,0.2)', color: '#4D6B4D' }}>
                          {confInstructor.name.charAt(0)}
                        </div>
                        <span className="text-[9px] font-mono" style={{ color: '#4D6B4D' }}>
                          {confInstructor.name}
                        </span>
                      </div>
                    )}
                    {slot.status === 'rejected' && (
                      <div className="mt-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                              style={{ background: 'rgba(140,58,24,0.1)', color: '#8C3A18' }}>
                          Rejected — no instructor assigned
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1">
          {creating ? (
            /* Create Mode */
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
                  NEW CLASS
                </p>
              </div>

              {saveMsg && (
                <div className="mb-4 px-3 py-2 rounded-sm text-xs font-mono"
                     style={{ background: 'rgba(77,107,77,0.1)', color: 'var(--moss)' }}>
                  {saveMsg}
                </div>
              )}

              <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>CLASS TYPE</label>
                  <select value={form.class_type}
                    onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {CLASS_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

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
                         style={{ color: 'var(--driftwood)' }}>TIME</label>
                  <input type="time" value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>DURATION</label>
                  <select value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {DURATIONS.map(m => (
                      <option key={m} value={m}>{m}min{m === 60 ? ' (1 hour)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>STATUS</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {Object.entries(STATUS_STYLES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>STREAM ID <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <input type="text" value={form.stream_id} placeholder="e.g. abc123xyz"
                    onChange={e => setForm(f => ({ ...f, stream_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>IMAGE URL <span style={{ opacity: 0.6 }}>(optional, placeholder shown if empty)</span></label>
                  <input type="text" value={form.image_url} placeholder="https://..."
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>PUBLISHED</label>
                  <select value={form.is_published}
                    onChange={e => setForm(f => ({ ...f, is_published: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    <option value="true">Yes — show on website</option>
                    <option value="false">No — hide from website</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button onClick={cancelCreate} disabled={saving}
                    className="flex-1 py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity border border-[var(--linen)] bg-transparent cursor-pointer"
                    style={{ color: 'var(--driftwood)' }}>
                    Cancel
                  </button>
                  <button onClick={handleCreate} disabled={saving || !form.date || !form.start_time}
                    className="flex-1 py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-40 border-none cursor-pointer"
                    style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                    {saving ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </div>
            </div>
          ) : !selected ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-display text-2xl font-light mb-2" style={{ color: 'var(--bark)' }}>
                Select a class
              </p>
              <p className="text-sm" style={{ color: 'var(--driftwood)' }}>
                Choose a class from the list, or create a new one
              </p>
            </div>
          ) : editingId ? (
            /* Edit Mode */
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
                  EDITING CLASS
                </p>
                <h2 className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>
                  {form.date || selected.date} · {form.start_time ? formatTime(form.start_time) : formatTime(selected.start_time)}
                </h2>
              </div>

              {saveMsg && (
                <div className="mb-4 px-3 py-2 rounded-sm text-xs font-mono"
                     style={{ background: 'rgba(77,107,77,0.1)', color: 'var(--moss)' }}>
                  {saveMsg}
                </div>
              )}

              <div className="rounded-lg border p-5 space-y-4" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>CLASS TYPE</label>
                  <select value={form.class_type}
                    onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {CLASS_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

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
                         style={{ color: 'var(--driftwood)' }}>TIME</label>
                  <input type="time" value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>DURATION</label>
                  <select value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {DURATIONS.map(m => (
                      <option key={m} value={m}>{m}min{m === 60 ? ' (1 hour)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>STATUS</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    {Object.entries(STATUS_STYLES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                {/* Instructor Selector */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>INSTRUCTOR <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <select value={editingId}
                    onChange={e => setInstructorSelector(e.target.value)}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    <option value="">— None —</option>
                    {allInstructors.map(ins => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name}{selectedWaitlistEntries.some(e => e.instructor_id === ins.id) ? ' (on waitlist)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>STREAM ID <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <input type="text" value={form.stream_id} placeholder="e.g. abc123xyz"
                    onChange={e => setForm(f => ({ ...f, stream_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>IMAGE URL <span style={{ opacity: 0.6 }}>(optional, placeholder shown if empty)</span></label>
                  <input type="text" value={form.image_url} placeholder="https://..."
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                         style={{ color: 'var(--driftwood)' }}>PUBLISHED</label>
                  <select value={form.is_published}
                    onChange={e => setForm(f => ({ ...f, is_published: e.target.value }))}
                    className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                    <option value="true">Yes — show on website</option>
                    <option value="false">No — hide from website</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button onClick={cancelEdit} disabled={saving}
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
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
                  {selected.class_type || 'Vinyasa'} CLASS
                </p>
                <h2 className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>
                  {selected.date} · {formatTime(selected.start_time)}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm" style={{ color: 'var(--driftwood)' }}>
                    {formatDurationLabel(selected.duration_hours)} ·
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                        style={{ color: STATUS_STYLES[selected.status].color, background: STATUS_STYLES[selected.status].bg }}>
                    {STATUS_STYLES[selected.status].label}
                  </span>
                </div>

                {/* Confirmed instructor from classes table */}
                {selected.status === 'confirmed' && confirmedInstructor && (
                  <div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-sm border"
                       style={{ background: 'rgba(77,107,77,0.05)', borderColor: 'rgba(77,107,77,0.2)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                         style={{ background: 'rgba(77,107,77,0.2)', color: '#4D6B4D' }}>
                      {confirmedInstructor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#4D6B4D' }}>
                        {confirmedInstructor.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--driftwood)' }}>
                        {confirmedInstructor.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Row */}
              <div className="flex gap-2 mb-6">
                <button onClick={() => startEdit(selected)}
                  className="px-4 py-2 text-sm font-medium tracking-wider rounded-sm transition-opacity border border-[var(--linen)] bg-transparent cursor-pointer"
                  style={{ color: 'var(--driftwood)' }}>
                  Edit Class
                </button>
              </div>

              {/* Waitlist Management for claimed slots */}
              {selected.status === 'claimed' && (
                <div className="mt-4 rounded-lg border p-5" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--bark)' }}>
                    INSTRUCTOR WAITLIST
                  </p>
                  {selectedWaitlistEntries.length === 0 ? (
                    <p className="text-sm py-2" style={{ color: 'var(--driftwood)' }}>
                      No instructors on waitlist
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedWaitlistEntries.map((entry, idx) => {
                        const ins = entry.instructor as Instructor | null
                        return (
                          <div key={entry.id}
                            className="flex items-center justify-between px-3 py-3 rounded-sm border"
                            style={{ background: 'rgba(140,90,10,0.05)', borderColor: 'rgba(140,90,10,0.2)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                                   style={{ background: 'rgba(140,90,10,0.2)', color: '#8C5A0A' }}>
                                {ins?.name?.charAt(0) ?? 'I'}
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#8C5A0A' }}>
                                  {ins?.name ?? 'Unknown Instructor'}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--driftwood)' }}>
                                  {ins?.email ?? ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                                    style={{ background: 'rgba(140,90,10,0.1)', color: '#8C5A0A' }}>
                                #{idx + 1}
                              </span>
                              <button onClick={() => handleAcceptWaitlist(entry)}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-50 border-none cursor-pointer"
                                style={{ background: 'var(--sage)', color: 'var(--white)' }}>
                                {saving ? '...' : 'Accept'}
                              </button>
                              <button onClick={() => handleRejectWaitlist(entry)}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-50 border border-red-300 bg-transparent cursor-pointer"
                                style={{ color: '#8C3A18' }}>
                                {saving ? '...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Link Stream Form */}
              <div className="rounded-lg border p-5" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--driftwood)' }}>
                  STREAM ID
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={streamInput}
                    onChange={e => setStreamInput(e.target.value)}
                    placeholder="e.g. abc123xyz"
                    className="flex-1 px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                    style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}
                  />
                  <button onClick={handleLinkStream} disabled={saving}
                    className="px-5 py-2 text-sm font-medium rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90 whitespace-nowrap bg-transparent"
                    style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                    {saving ? 'Saving...' : 'Link Stream'}
                  </button>
                </div>
                {saveMsg && <p className="text-xs mt-2 font-mono" style={{ color: 'var(--moss)' }}>{saveMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function formatDurationLabel(hours: number) {
  const minutes = hours * 60
  if (minutes < 60) return `${minutes}m`
  if (minutes === 60) return '1h'
  return `${minutes / 60}h`
}
