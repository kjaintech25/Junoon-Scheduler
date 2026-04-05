'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed'
  instructor_id: string | null
}

type ConfirmedClass = {
  id: string
  slot_id: string
  instructor_id: string
  class_title: string
  confirmed_at: string
  slots: { date: string; start_time: string; duration_hours: number } | null
  instructor: { name: string; email: string } | null
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

export function DashboardTab() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [confirmedClasses, setConfirmedClasses] = useState<ConfirmedClass[]>([])
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

      // Fetch confirmed classes from classes table with joins
      const { data: clsData } = await supabase
        .from('classes')
        .select('*, slots(date, start_time, duration_hours), instructor:instructors(name, email)')
        .order('confirmed_at', { ascending: false })
      setConfirmedClasses((clsData || []) as ConfirmedClass[])

      setLoading(false)
    }
    fetchSlots()
  }, [])

  const slotsByDate = (date: Date) =>
    slots.filter(s => s.date === fmt(date))

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-light" style={{ color: 'var(--bark)' }}>
          Upcoming Classes
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
            style={{ borderColor: 'var(--linen)', color: 'var(--driftwood)' }}>‹</button>
          <span className="text-sm font-mono px-3" style={{ color: 'var(--soil)' }}>
            {fmtRange(weekDates)}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer"
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
            {confirmedClasses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-sm text-center" style={{ color: 'var(--driftwood)' }}>
                  No confirmed classes yet
                </td>
              </tr>
            ) : confirmedClasses.map(cls => {
              const slotData = cls.slots as { date: string; start_time: string; duration_hours: number } | null
              const instructorData = cls.instructor as { name: string; email: string } | null
              return (
                <tr key={cls.id} className="border-b last:border-0 hover:bg-[#faf7f2] transition-colors"
                    style={{ borderColor: 'var(--linen)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                           style={{ background: 'var(--ivory)', color: 'var(--clay)' }}>
                        {instructorData?.name?.charAt(0) ?? '—'}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--bark)' }}>
                        {instructorData?.name ?? 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--soil)' }}>
                    {slotData?.duration_hours ?? '?'}h class
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--soil)' }}>
                    {slotData?.date ?? '??'} · {slotData?.start_time?.slice(0, 5) ?? '??:??'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-sm uppercase tracking-wider ${STATUS_STYLES.confirmed.badge}`}>
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
