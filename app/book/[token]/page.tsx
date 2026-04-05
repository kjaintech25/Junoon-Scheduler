'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

type Instructor = {
  id: string
  name: string
  email: string
}

const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

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

function fmtWeekRange(dates: Date[]) {
  return `Week of ${dates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${dates[6].getDate()}, ${dates[6].getFullYear()}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function addHours(t: string, h: number) {
  const [hh, mm] = t.split(':').map(Number)
  return formatTime(`${String(hh + h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
}

export default function InstructorBooking() {
  const params = useParams()
  const token = params.token as string

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [joiningWaitlist, setJoiningWaitlist] = useState(false)
  const [leavingWaitlist, setLeavingWaitlist] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)

  const fetchSlots = async (insId: string) => {
    const { data: openSlots } = await supabase
      .from('slots')
      .select('*')
      .eq('status', 'open')
      .order('date', { ascending: true })
    const { data: mySlots } = await supabase
      .from('slots')
      .select('*')
      .eq('instructor_id', insId)
      .neq('status', 'open')
      .order('date', { ascending: true })
    setSlots([...(openSlots || []), ...(mySlots || [])])
  }

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      const { data: ins, error: insErr } = await supabase
        .from('instructors')
        .select('*')
        .eq('unique_token', token)
        .single()
      if (insErr || !ins) { setError('Invalid booking link.'); setLoading(false); return }
      setInstructor(ins)
      await fetchSlots(ins.id)
      setLoading(false)
    }
    load()
  }, [token])

  const handleJoinWaitlist = async () => {
    if (!selected || !instructor) return
    setJoiningWaitlist(true)
    const { error: upErr } = await supabase
      .from('slots')
      .update({ status: 'claimed', instructor_id: instructor.id })
      .eq('id', selected.id)
    if (!upErr) {
      setSelected(null)
      await fetchSlots(instructor.id)
    }
    setJoiningWaitlist(false)
  }

  const handleLeaveWaitlist = async () => {
    if (!selected || !instructor) return
    setLeavingWaitlist(true)
    const { error: upErr } = await supabase
      .from('slots')
      .update({ status: 'open', instructor_id: null })
      .eq('id', selected.id)
    if (!upErr) {
      setSelected(null)
      await fetchSlots(instructor.id)
    }
    setLeavingWaitlist(false)
  }

  const slotsByDate = (date: Date) =>
    slots.filter(s => s.date === fmt(date))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <p className="font-display text-2xl font-light mb-2" style={{ color: 'var(--bark)' }}>Access Denied</p>
          <p className="text-sm" style={{ color: 'var(--driftwood)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left Sidebar */}
      <aside className="w-56 border-r shrink-0 py-6 px-4 flex flex-col"
             style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <div className="px-3 mb-8">
          <span className="font-display text-lg font-light tracking-wide" style={{ color: 'var(--bark)' }}>
            Junoon
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 mb-6">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
               style={{ background: 'var(--bark)', color: 'var(--turmeric)' }}>
            {instructor?.name?.charAt(0) ?? 'I'}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{instructor?.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--driftwood)' }}>Instructor</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { label: 'Available Classes', icon: '◫', active: true },
            { label: 'My Schedule', icon: '◷', href: `/book/${token}/schedule` },
            { label: 'Profile', icon: '◷', href: '#' },
          ].map(({ label, icon, active, href }) => (
            <Link key={label} href={href ?? '#'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors"
              style={{
                background: active ? 'rgba(196,114,74,0.08)' : 'transparent',
                color: active ? 'var(--clay)' : 'var(--driftwood)',
                fontWeight: active ? 500 : 300,
              }}>
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-3 pt-4 border-t" style={{ borderColor: 'var(--linen)' }}>
          <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--driftwood)' }}>
            QUICK ACTIONS
          </p>
          <div className="space-y-1">
            <p className="text-xs py-1" style={{ color: 'var(--driftwood)' }}>Dashboard</p>
            <p className="text-xs py-1" style={{ color: 'var(--driftwood)' }}>Settings</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 px-8 py-8 transition-all ${selected ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="mb-6">
          <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
            Available Classes
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--sage)' }} />
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>
              {fmtWeekRange(weekDates).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--linen)', color: 'var(--driftwood)' }}>‹</button>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="w-7 h-7 flex items-center justify-center rounded border hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--linen)', color: 'var(--driftwood)' }}>›</button>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, i) => {
            const daySlots = slotsByDate(date)
            const isToday = fmt(date) === fmt(new Date())
            return (
              <div key={i}>
                <div className="text-center mb-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1"
                     style={{ color: 'var(--driftwood)' }}>{DAYS_SHORT[i]}</p>
                  <p className="text-xl font-medium"
                     style={{ color: isToday ? 'var(--clay)' : 'var(--bark)' }}>
                    {date.getDate()}
                  </p>
                </div>
                <div className="space-y-2">
                  {daySlots.length === 0 ? (
                    <div className="rounded p-6 text-center" style={{ background: 'var(--linen)', opacity: 0.5 }}>
                      <p className="font-mono text-[9px] uppercase tracking-widest"
                         style={{ color: 'var(--driftwood)' }}>—</p>
                    </div>
                  ) : daySlots.map(slot => {
                    const isYours = slot.instructor_id === instructor?.id
                    const isOpen = slot.status === 'open'
                    const isClaimed = slot.status === 'claimed'
                    const bg = isOpen ? 'rgba(122,155,122,0.12)' : 'rgba(229,175,112,0.12)'
                    const bc = isOpen ? 'var(--sage)' : 'var(--turmeric)'
                    const badgeColor = isOpen ? 'var(--moss)' : 'var(--turmeric)'
                    const clickable = isOpen || (isClaimed && isYours)
                    return (
                      <div key={slot.id}
                        className="w-full text-left rounded p-3 border transition-all"
                        style={{
                          background: bg, borderColor: bc,
                          cursor: clickable ? 'pointer' : 'default',
                          opacity: clickable ? 1 : 0.6,
                        }}
                        onClick={() => clickable && setSelected(slot)}>
                        <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: badgeColor }}>
                          {isOpen ? 'AVAILABLE' : isYours ? 'WAITLISTED' : 'CLAIMED BY OTHER'}
                        </p>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--bark)' }}>
                          {formatTime(slot.start_time)} —<br />{addHours(slot.start_time, slot.duration_hours)}
                        </p>
                        <p className="font-mono text-[9px]" style={{ color: 'var(--driftwood)' }}>
                          {slot.duration_hours * 60}m
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Right Detail Panel */}
      {selected && (() => {
        const isOpen = selected.status === 'open'
        const isYours = selected.instructor_id === instructor?.id
        return (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelected(null)} />
          <div className="relative w-80 shadow-2xl flex flex-col overflow-y-auto"
               style={{ background: 'var(--white)' }}>
            <div className="relative h-48 flex items-end p-4"
                 style={{ background: isOpen
                   ? 'linear-gradient(160deg, var(--clay) 0%, var(--bark) 100%)'
                   : 'linear-gradient(160deg, var(--turmeric) 0%, var(--bark) 100%)' }}>
              <button onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-sm"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--white)' }}>✕</button>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm mb-2 inline-block"
                      style={{ background: isOpen ? 'var(--sage)' : 'var(--turmeric)', color: 'var(--white)' }}>
                  {isOpen ? 'AVAILABLE SLOT' : 'WAITLISTED'}
                </span>
                <p className="font-display text-2xl font-light" style={{ color: 'var(--white)' }}>
                  {selected.duration_hours * 60}min Class Slot
                </p>
              </div>
            </div>

            <div className="p-5 flex-1">
              <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b" style={{ borderColor: 'var(--linen)' }}>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>DURATION</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{selected.duration_hours * 60} min</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>DATE</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{selected.date}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>TIME</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{formatTime(selected.start_time)}</p>
                </div>
              </div>

              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--bark)' }}>
                  {isOpen ? 'About this Slot' : 'Your Status'}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--soil)' }}>
                  {isOpen
                    ? 'This is an open teaching slot you can join the waitlist for. Once joined, Junoon admin will review and confirm your assignment.'
                    : 'You are on the waitlist for this slot. Junoon admin will review and confirm your assignment.'}
                </p>
              </div>

              {isOpen && (
              <div className="rounded-sm p-3 flex gap-2 items-start"
                   style={{ background: 'var(--ivory)', border: '1px solid var(--linen)' }}>
                <span style={{ color: 'var(--clay)' }}>ⓘ</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--soil)' }}>
                  Joining the waitlist lets admin know you're available. Cancellations must be made at least 24 hours in advance once confirmed.
                </p>
              </div>
              )}
            </div>

            <div className="p-5 border-t" style={{ borderColor: 'var(--linen)' }}>
              {isOpen ? (
                <button onClick={handleJoinWaitlist} disabled={joiningWaitlist}
                  className="w-full py-3.5 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90"
                  style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                  {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                </button>
              ) : (
                <div>
                  <p className="text-center text-sm font-medium mb-3" style={{ color: 'var(--moss)' }}>
                    ✓ Waitlisted — pending confirmation
                  </p>
                  <button onClick={handleLeaveWaitlist} disabled={leavingWaitlist}
                    className="w-full py-3 text-sm font-medium tracking-wider rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90 border border-red-300 bg-transparent"
                    style={{ color: 'var(--clay)' }}>
                    {leavingWaitlist ? 'Leaving...' : 'Leave Waitlist'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
