'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed'
}

const CLASS_TYPES = ['Vinyasa Flow', 'HIIT Blast', 'Guided Meditation', 'Pilates', 'Sound Bath', 'Power HIIT', 'Yin Yoga']
const TYPE_COLORS: Record<string, string> = {
  'Vinyasa Flow':      'bg-[#fef5e4] text-[#8C5A0A] border-[#E8B870]',
  'HIIT Blast':        'bg-[#ede8df] text-[#4A3728] border-[#8C7B6B]',
  'Guided Meditation': 'bg-[#fbeee8] text-[#8C3A18] border-[#D4935A]',
  'Pilates':           'bg-[#e8f4ec] text-[#4D6B4D] border-[#7A9B7A]',
  'Sound Bath':        'bg-[#eceef5] text-[#3D4A6B] border-[#3D4A6B]',
  'Power HIIT':        'bg-[#fbeee8] text-[#8C3A18] border-[#D4935A]',
  'Yin Yoga':          'bg-[#e8f4ec] text-[#4D6B4D] border-[#7A9B7A]',
}

function groupByDayOfWeek(slots: Slot[]) {
  const days: Record<string, Slot[]> = {}
  slots.forEach(slot => {
    const d = new Date(slot.date + 'T00:00:00')
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
    if (!days[dayName]) days[dayName] = []
    days[dayName].push(slot)
  })
  return days
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function addHours(t: string, h: number) {
  const [hh, mm] = t.split(':').map(Number)
  const total = hh + h
  return `${String(total % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function SlotManagement() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    date: '',
    start_time: '',
    duration_hours: '1',
    class_type: 'Vinyasa Flow',
    stream_id: '',
  })

  useEffect(() => { fetchSlots() }, [])

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
    setSlots(data || [])
    setLoading(false)
  }

  const handlePublish = async () => {
    if (!form.date || !form.start_time) return
    setPublishing(true)
    const { error } = await supabase.from('slots').insert([{
      date: form.date,
      start_time: form.start_time,
      duration_hours: parseInt(form.duration_hours),
      status: 'open',
      stream_id: form.stream_id.trim() || null,
    }])
    if (!error) {
      setSuccessMsg('Slot published!')
      setForm({ date: '', start_time: '', duration_hours: '1', class_type: 'Vinyasa Flow', stream_id: '' })
      fetchSlots()
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setPublishing(false)
  }

  const grouped = groupByDayOfWeek(slots)

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Top Nav */}
      <nav className="border-b px-8 h-14 flex items-center justify-between sticky top-0 z-50"
           style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <span className="font-display text-xl font-light tracking-wide" style={{ color: 'var(--bark)' }}>
          JUNOON
        </span>
        <div className="flex items-center gap-8">
          {[
            { label: 'Dashboard', href: '/' },
            { label: 'Schedule', href: '/admin/slots' },
            { label: 'Classes', href: '/admin/classes' },
            { label: 'Stream', href: '/admin/stream' },
            { label: 'Instructors', href: '#' },
            { label: 'Settings', href: '#' },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              className="text-sm font-medium relative"
              style={{ color: label === 'Schedule' ? 'var(--clay)' : 'var(--driftwood)' }}>
              {label}
              {label === 'Schedule' && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-[2px]"
                      style={{ background: 'var(--clay)' }} />
              )}
            </Link>
          ))}
        </div>
        <button className="px-4 py-2 text-sm font-medium rounded-sm"
                style={{ background: 'var(--bark)', color: 'var(--white)' }}>
          + Create New Slot
        </button>
      </nav>

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        {/* Left Sidebar */}
        <aside className="w-60 border-r shrink-0 py-6 px-4"
               style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
          {/* Admin profile */}
          <div className="flex items-center gap-3 px-3 mb-6">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
                 style={{ background: 'var(--bark)', color: 'var(--turmeric)' }}>A</div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>Admin Ops</p>
              <p className="text-[11px]" style={{ color: 'var(--driftwood)' }}>Junoon Wellness</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { label: 'Dashboard', href: '/', icon: '⊞' },
              { label: 'Schedule', href: '/admin/slots', icon: '◫', active: true },
              { label: 'Instructors', href: '#', icon: '◷' },
              { label: 'Settings', href: '#', icon: '⚙' },
            ].map(({ label, href, icon, active }) => (
              <Link key={label} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors"
                style={{
                  background: active ? 'rgba(196,114,74,0.08)' : 'transparent',
                  color: active ? 'var(--clay)' : 'var(--driftwood)',
                  fontWeight: active ? 500 : 300,
                }}>
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-10 py-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
              Slot Management
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--driftwood)' }}>
              DAY & SLOT CONFIGURATION
            </p>
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading slots...</p>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center"
                 style={{ borderColor: 'var(--linen)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--driftwood)' }}>No slots yet</p>
              <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Use Quick Add Slot to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([day, daySlots]) => (
                <div key={day} className="rounded-lg border overflow-hidden"
                     style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b"
                       style={{ borderColor: 'var(--linen)' }}>
                    <h2 className="font-display text-xl font-light" style={{ color: 'var(--bark)' }}>{day}</h2>
                    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(196,114,74,0.1)', color: 'var(--clay)' }}>
                      {daySlots.length} {daySlots.length === 1 ? 'SLOT' : 'SLOTS'}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--linen)' }}>
                    {daySlots.map(slot => {
                      const typeColor = TYPE_COLORS[CLASS_TYPES[0]] // default
                      return (
                        <div key={slot.id} className="px-5 py-4 flex items-center gap-8">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>START</p>
                            <p className="text-base font-medium" style={{ color: 'var(--bark)' }}>
                              {formatTime(slot.start_time)}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>END</p>
                            <p className="text-base font-medium" style={{ color: 'var(--bark)' }}>
                              {formatTime(addHours(slot.start_time, slot.duration_hours))}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                               style={{ color: 'var(--driftwood)' }}>TYPE</p>
                            <span className={`text-xs px-2 py-1 rounded border font-medium ${typeColor}`}>
                              {slot.duration_hours}h Class
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Active Day */}
          <button className="mt-4 w-full rounded-lg border border-dashed py-6 flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--clay)' }}>
            <span className="text-xl" style={{ color: 'var(--clay)' }}>⊞</span>
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--clay)' }}>
              ADD ACTIVE DAY
            </span>
          </button>
        </main>

        {/* Right Panel — Quick Add Slot */}
        <aside className="w-72 border-l shrink-0 py-6 px-5"
               style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-light" style={{ color: 'var(--bark)' }}>
              Quick Add Slot
            </h3>
            <span style={{ color: 'var(--clay)' }}>⚡</span>
          </div>

          {successMsg && (
            <div className="mb-4 px-3 py-2 rounded-sm text-xs font-mono"
                 style={{ background: 'rgba(77,107,77,0.1)', color: 'var(--moss)' }}>
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                     style={{ color: 'var(--driftwood)' }}>SELECT DAY</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>START TIME</label>
                <input type="time" value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                       style={{ color: 'var(--driftwood)' }}>DURATION</label>
                <select value={form.duration_hours}
                  onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                  className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                  style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                  <option value="1">1 hr</option>
                  <option value="2">2 hrs</option>
                  <option value="3">3 hrs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                     style={{ color: 'var(--driftwood)' }}>CLASS TYPE</label>
              <select value={form.class_type}
                onChange={e => setForm(f => ({ ...f, class_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors"
                style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }}>
                {CLASS_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest block mb-1.5"
                     style={{ color: 'var(--driftwood)' }}>ZENSTREAM ID <span style={{ color: 'var(--driftwood)', opacity: 0.6 }}>(optional)</span></label>
              <input type="text" value={form.stream_id} placeholder="e.g. 2f0b755a..."
                onChange={e => setForm(f => ({ ...f, stream_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-sm border text-sm outline-none focus:border-[var(--clay)] transition-colors font-mono"
                style={{ borderColor: 'var(--linen)', background: 'var(--cream)', color: 'var(--bark)' }} />
            </div>

            <button onClick={handlePublish} disabled={publishing || !form.date || !form.start_time}
              className="w-full py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-40 hover:opacity-90 mt-2"
              style={{ background: 'var(--clay)', color: 'var(--white)' }}>
              {publishing ? 'PUBLISHING...' : 'PUBLISH NEW SLOT'}
            </button>

            <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--driftwood)' }}>
              Publishing will instantly notify all subscribed instructors for the selected day.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="rounded-sm p-3 border" style={{ borderColor: 'var(--linen)', background: 'var(--cream)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>
                FILL RATE
              </p>
              <p className="font-display text-2xl font-light" style={{ color: 'var(--clay)' }}>92%</p>
            </div>
            <div className="rounded-sm p-3 border" style={{ borderColor: 'var(--turmeric)', background: 'rgba(232,184,112,0.08)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>
                AVG RATING
              </p>
              <p className="font-display text-2xl font-light flex items-center gap-1" style={{ color: 'var(--bark)' }}>
                <span style={{ color: 'var(--turmeric)' }}>★</span> 4.9
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
