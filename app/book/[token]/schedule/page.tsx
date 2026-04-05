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
  status: 'open' | 'claimed' | 'confirmed' | 'rejected'
}

type WaitlistEntry = {
  slot: Slot
  signed_up_at: string
}

type ClassEntry = {
  slot: Slot
  confirmed_at: string
}

type Instructor = {
  id: string
  name: string
  email: string
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function addHours(t: string, h: number) {
  const [hh, mm] = t.split(':').map(Number)
  const total = hh + h
  return formatTime(`${String(total % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  }
}

export default function MySchedule() {
  const params = useParams()
  const token = params.token as string

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [confirmedEntries, setConfirmedEntries] = useState<ClassEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Waitlist' | 'Completed'>('Upcoming')

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      const { data: ins } = await supabase
        .from('instructors').select('*').eq('unique_token', token).single()
      if (!ins) { setLoading(false); return }
      setInstructor(ins)

      // Fetch waitlisted slots (from waitlist table)
      const { data: wlData } = await supabase
        .from('waitlist')
        .select('slot:slots(*), signed_up_at')
        .eq('instructor_id', ins.id)
      setWaitlistEntries(wlData?.filter((w: any) => w.slot) || [])

      // Fetch confirmed slots (from classes table)
      const { data: clsData } = await supabase
        .from('classes')
        .select('slot:slots(*), confirmed_at')
        .eq('instructor_id', ins.id)
      setConfirmedEntries(clsData?.filter((c: any) => c.slot) || [])

      setLoading(false)
    }
    load()
  }, [token])

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left Sidebar */}
      <aside className="w-56 border-r shrink-0 py-6 px-4 flex flex-col"
             style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <div className="px-3 mb-8">
          <span className="font-display text-lg font-light tracking-wide" style={{ color: 'var(--bark)' }}>Junoon</span>
        </div>
        <div className="flex items-center gap-3 px-3 mb-6">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
               style={{ background: 'var(--bark)', color: 'var(--turmeric)' }}>
            {instructor?.name?.charAt(0) ?? 'I'}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>{instructor?.name ?? 'Instructor'}</p>
            <p className="text-[11px]" style={{ color: 'var(--driftwood)' }}>Instructor</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { label: 'Available Classes', icon: '◫', href: `/book/${token}` },
            { label: 'My Schedule', icon: '◷', active: true },
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-10 py-8">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
            My Schedule
          </h1>
          <p className="text-sm font-light" style={{ color: 'var(--driftwood)' }}>
            Manage your teaching roster and track upcoming sessions across all studios.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-8" style={{ borderColor: 'var(--linen)' }}>
          {(['Upcoming', 'Waitlist', 'Completed'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="pb-3 text-sm font-medium relative transition-colors"
              style={{ color: activeTab === tab ? 'var(--clay)' : 'var(--driftwood)' }}>
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--clay)' }} />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
        ) : (
          <div className="space-y-8">
            {/* Confirmed Sessions */}
            {activeTab === 'Upcoming' && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 font-medium text-base" style={{ color: 'var(--bark)' }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--clay)' }} />
                      Confirmed Sessions
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>
                      TODAY, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  {confirmedEntries.length === 0 ? (
                    <div className="rounded-lg border py-8 text-center" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                      <p className="text-sm" style={{ color: 'var(--driftwood)' }}>No confirmed sessions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {confirmedEntries.map(entry => {
                        const slot = entry.slot as Slot
                        const { month, day } = fmtDate(slot.date)
                        return (
                          <div key={slot.id}
                            className="flex items-start gap-4 rounded-lg border p-4"
                            style={{ background: 'var(--white)', borderColor: 'var(--linen)', borderLeft: '3px solid var(--clay)' }}>
                            <div className="text-center min-w-[40px]">
                              <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>{month}</p>
                              <p className="font-display text-2xl font-light" style={{ color: 'var(--bark)' }}>{day}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm"
                                      style={{ background: 'rgba(61,74,107,0.1)', color: 'var(--indigo)' }}>CONFIRMED</span>
                                <span className="text-xs" style={{ color: 'var(--driftwood)' }}>
                                  {formatTime(slot.start_time)} – {addHours(slot.start_time, slot.duration_hours)}
                                </span>
                              </div>
                              <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--bark)' }}>
                                {slot.duration_hours}h Teaching Slot
                              </p>
                              <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Junoon Wellness Studio</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1.5 text-xs rounded-sm border transition-opacity hover:opacity-70"
                                      style={{ borderColor: 'var(--linen)', color: 'var(--soil)' }}>Details</button>
                              <button className="px-3 py-1.5 text-xs rounded-sm border transition-opacity hover:opacity-70"
                                      style={{ borderColor: 'var(--blush)', color: '#8C3A18' }}>Cancel</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                {/* Waitlist */}
                {waitlistEntries.length > 0 && (
                  <section>
                    <h2 className="flex items-center gap-2 font-medium text-base mb-4" style={{ color: 'var(--bark)' }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--turmeric)' }} />
                      Waitlist Status
                    </h2>
                    <div className="space-y-3">
                      {waitlistEntries.map((entry, idx) => {
                        const slot = entry.slot as Slot
                        const { month, day } = fmtDate(slot.date)
                        return (
                          <div key={slot.id}
                            className="flex items-start gap-4 rounded-lg border p-4"
                            style={{ background: 'var(--white)', borderColor: 'var(--linen)', borderLeft: '3px solid var(--turmeric)' }}>
                            <div className="text-center min-w-[40px]">
                              <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>{month}</p>
                              <p className="font-display text-2xl font-light" style={{ color: 'var(--bark)' }}>{day}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm"
                                      style={{ background: 'rgba(232,184,112,0.2)', color: '#8C5A0A' }}>
                                  WAITLIST POSITION #{idx + 1}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--driftwood)' }}>
                                  {formatTime(slot.start_time)} – {addHours(slot.start_time, slot.duration_hours)}
                                </span>
                              </div>
                              <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--bark)' }}>
                                {slot.duration_hours}h Teaching Slot
                              </p>
                              <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Junoon Wellness Studio</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1.5 text-xs rounded-sm border transition-opacity hover:opacity-70"
                                      style={{ borderColor: 'var(--linen)', color: 'var(--soil)' }}>View Queue</button>
                              <button className="px-3 py-1.5 text-xs rounded-sm border transition-opacity hover:opacity-70"
                                      style={{ borderColor: 'var(--blush)', color: '#8C3A18' }}>Leave Waitlist</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === 'Waitlist' && (
              <div className="space-y-3">
                {waitlistEntries.length === 0 ? (
                  <div className="rounded-lg border py-8 text-center" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                    <p className="text-sm" style={{ color: 'var(--driftwood)' }}>No waitlisted slots</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--driftwood)' }}>You don't have any pending waitlist entries.</p>
                  </div>
                ) : waitlistEntries.map((entry, idx) => {
                  const slot = entry.slot as Slot
                  const { month, day } = fmtDate(slot.date)
                  return (
                    <div key={slot.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                      style={{ background: 'var(--white)', borderColor: 'var(--linen)', borderLeft: '3px solid var(--turmeric)' }}>
                      <div className="text-center min-w-[40px]">
                        <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>{month}</p>
                        <p className="font-display text-2xl font-light" style={{ color: 'var(--bark)' }}>{day}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm"
                                style={{ background: 'rgba(232,184,112,0.2)', color: '#8C5A0A' }}>
                            WAITLISTED — Position #{idx + 1}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--driftwood)' }}>
                            {formatTime(slot.start_time)} – {addHours(slot.start_time, slot.duration_hours)}
                          </span>
                        </div>
                        <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--bark)' }}>
                          {slot.duration_hours}h Teaching Slot
                        </p>
                        <p className="text-xs" style={{ color: 'var(--driftwood)' }}>Pending admin confirmation</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'Completed' && (
              <div className="rounded-lg border py-8 text-center" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                <p className="text-sm" style={{ color: 'var(--driftwood)' }}>No completed classes yet</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Right Panel — Schedule Insights */}
      <aside className="w-64 border-l shrink-0 py-6 px-5"
             style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <h3 className="font-display text-lg font-light mb-5" style={{ color: 'var(--bark)' }}>
          Schedule Insights
        </h3>

        <div className="space-y-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>TOTAL CLASSES</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>{confirmedEntries.length}</p>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(196,114,74,0.1)', color: 'var(--clay)' }}>
                CONFIRMED
              </span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>TEACHING HOURS</p>
            <p className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>
              {confirmedEntries.reduce((acc, e) => acc + (e.slot as Slot).duration_hours, 0)}
            </p>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--driftwood)' }}>PENDING REVIEW</p>
            <p className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>{waitlistEntries.length}</p>
          </div>
        </div>

        {/* Substitute card */}
        <div className="mt-8 rounded-sm overflow-hidden border" style={{ borderColor: 'var(--linen)' }}>
          <div className="p-4 pb-3" style={{ background: 'var(--bark)' }}>
            <p className="font-display text-base font-light mb-1" style={{ color: 'var(--white)' }}>Substitute Needed?</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--driftwood)' }}>
              Requests for the upcoming weekend are now open.
            </p>
          </div>
          <button className="w-full py-2.5 text-xs font-medium tracking-wider border-t font-mono uppercase"
                  style={{ background: 'var(--white)', color: 'var(--bark)', borderColor: 'var(--linen)' }}>
            SUBMIT REQUEST
          </button>
        </div>
      </aside>
    </div>
  )
}
