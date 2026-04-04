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
  instructor_id: string | null
}

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  open:      { badge: 'bg-[#e8f4ec] text-[#4D6B4D] border border-[#7A9B7A]', label: 'OPEN' },
  claimed:   { badge: 'bg-[#fef5e4] text-[#8C5A0A] border border-[#E8B870]', label: 'CLAIMED' },
  confirmed: { badge: 'bg-[#eceef5] text-[#3D4A6B] border border-[#3D4A6B]', label: 'CONFIRMED' },
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

function fmtRange(dates: Date[]) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${dates[6].toLocaleDateString('en-US', opts)}`
}

export default function AdminDashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('slots')
        .select('*')
        .order('date', { ascending: true })
      setSlots(data || [])
      setLoading(false)
    }
    fetchSlots()
  }, [])

  const slotsByDate = (date: Date) =>
    slots.filter(s => s.date === fmt(date))

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
              style={{ color: label === 'Dashboard' ? 'var(--clay)' : 'var(--driftwood)' }}>
              {label}
              {label === 'Dashboard' && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-[2px]"
                      style={{ background: 'var(--clay)' }} />
              )}
            </Link>
          ))}
        </div>
        <Link href="/admin/slots"
          className="px-4 py-2 text-sm font-medium rounded-sm transition-opacity hover:opacity-90"
          style={{ background: 'var(--clay)', color: 'var(--white)' }}>
          Create New Slot
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-light" style={{ color: 'var(--bark)' }}>
            Upcoming Classes
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)}
              className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity"
              style={{ borderColor: 'var(--linen)', color: 'var(--driftwood)' }}>‹</button>
            <span className="text-sm font-mono px-3" style={{ color: 'var(--soil)' }}>
              {fmtRange(weekDates)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)}
              className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity"
              style={{ borderColor: 'var(--linen)', color: 'var(--driftwood)' }}>›</button>
          </div>
        </div>

        {/* Week Grid */}
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
        ) : (
          <div className="grid grid-cols-7 gap-3 mb-10">
            {weekDates.map((date, i) => {
              const daySlots = slotsByDate(date)
              const isToday = fmt(date) === fmt(new Date())
              return (
                <div key={i}>
                  <div className="text-center mb-2">
                    <p className="font-mono text-[10px] tracking-widest uppercase mb-1"
                       style={{ color: 'var(--driftwood)' }}>{DAYS[i]}</p>
                    <p className="text-lg font-medium"
                       style={{ color: isToday ? 'var(--clay)' : 'var(--bark)' }}>
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {daySlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4 rounded border border-dashed"
                           style={{ borderColor: 'var(--linen)' }}>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--driftwood)' }}>
                          NO SLOTS
                        </span>
                      </div>
                    ) : daySlots.map(slot => {
                      const s = STATUS_STYLES[slot.status]
                      return (
                        <div key={slot.id}
                          className="rounded p-2 border"
                          style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
                          <p className="text-[10px] font-mono mb-1" style={{ color: 'var(--clay)' }}>
                            {slot.start_time.slice(0, 5)}
                          </p>
                          <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--bark)' }}>
                            {slot.duration_hours}h slot
                          </p>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${s.badge}`}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Confirmed Classes Table */}
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--linen)' }}>
            <h2 className="font-display text-xl font-light" style={{ color: 'var(--bark)' }}>
              Confirmed Classes
            </h2>
            <button className="font-mono text-[10px] tracking-widest uppercase hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--clay)' }}>
              VIEW ALL CLASS HISTORY
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--linen)' }}>
                {['Instructor', 'Session', 'Date & Time', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 font-mono text-[10px] tracking-widest uppercase"
                      style={{ color: 'var(--driftwood)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.filter(s => s.status === 'confirmed').length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-center" style={{ color: 'var(--driftwood)' }}>
                    No confirmed classes yet
                  </td>
                </tr>
              ) : slots.filter(s => s.status === 'confirmed').map(slot => (
                <tr key={slot.id} className="border-b last:border-0 hover:bg-[#faf7f2] transition-colors"
                    style={{ borderColor: 'var(--linen)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                           style={{ background: 'var(--ivory)', color: 'var(--clay)' }}>—</div>
                      <span className="text-sm" style={{ color: 'var(--bark)' }}>Assigned</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--soil)' }}>
                    {slot.duration_hours}h class
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--soil)' }}>
                    {slot.date} · {slot.start_time.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-sm uppercase tracking-wider ${STATUS_STYLES.confirmed.badge}`}>
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
