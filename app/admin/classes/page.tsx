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
  stream_id: string | null
}

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  open:      { badge: 'bg-[#e8f4ec] text-[#4D6B4D] border border-[#7A9B7A]', label: 'OPEN' },
  claimed:   { badge: 'bg-[#fef5e4] text-[#8C5A0A] border border-[#E8B870]', label: 'CLAIMED' },
  confirmed: { badge: 'bg-[#eceef5] text-[#3D4A6B] border border-[#3D4A6B]', label: 'CONFIRMED' },
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function ClassesPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [streamInput, setStreamInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
    setSlots(data || [])
    setLoading(false)
  }

  const handleSelect = (slot: Slot) => {
    setSelected(slot)
    setStreamInput(slot.stream_id || '')
    setSaveMsg('')
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
            { label: 'Instructors', href: '#' },
            { label: 'Settings', href: '#' },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              className="text-sm font-medium relative"
              style={{ color: label === 'Classes' ? 'var(--clay)' : 'var(--driftwood)' }}>
              {label}
              {label === 'Classes' && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-[2px]"
                      style={{ background: 'var(--clay)' }} />
              )}
            </Link>
          ))}
        </div>
        <Link href="/admin/slots"
          className="px-4 py-2 text-sm font-medium rounded-sm"
          style={{ background: 'var(--bark)', color: 'var(--white)' }}>
          + Create New Slot
        </Link>
      </nav>

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>

        {/* Left — Slot List */}
        <div className="w-80 border-r shrink-0 overflow-y-auto"
             style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--linen)' }}>
            <h2 className="font-display text-xl font-light" style={{ color: 'var(--bark)' }}>
              All Classes
            </h2>
            <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--driftwood)' }}>
              {slots.length} SLOTS TOTAL
            </p>
          </div>

          {loading ? (
            <p className="px-5 py-4 text-sm" style={{ color: 'var(--driftwood)' }}>Loading...</p>
          ) : slots.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--driftwood)' }}>No slots yet</p>
              <Link href="/admin/slots" className="text-xs mt-1 block" style={{ color: 'var(--clay)' }}>
                Create one →
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--linen)' }}>
              {slots.map(slot => {
                const s = STATUS_STYLES[slot.status]
                const isSelected = selected?.id === slot.id
                return (
                  <button key={slot.id} onClick={() => handleSelect(slot)}
                    className="w-full text-left px-5 py-4 transition-colors hover:opacity-80"
                    style={{
                      background: isSelected ? 'var(--ivory)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--clay)' : '3px solid transparent',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--bark)' }}>
                        {slot.date}
                      </p>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--driftwood)' }}>
                      {formatTime(slot.start_time)} · {slot.duration_hours}h
                    </p>
                    {slot.stream_id && (
                      <p className="text-[10px] mt-1 font-mono truncate" style={{ color: 'var(--sage)' }}>
                        ● Stream linked
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — Player Panel */}
        <div className="flex-1 px-8 py-8">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="font-display text-2xl font-light mb-2" style={{ color: 'var(--bark)' }}>
                  Select a class
                </p>
                <p className="text-sm" style={{ color: 'var(--driftwood)' }}>
                  Choose a slot from the left to link a Zenstream player
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              {/* Class Info */}
              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
                  SELECTED CLASS
                </p>
                <h2 className="font-display text-3xl font-light" style={{ color: 'var(--bark)' }}>
                  {selected.date} · {formatTime(selected.start_time)}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--driftwood)' }}>
                  {selected.duration_hours}h slot · {STATUS_STYLES[selected.status].label}
                </p>
              </div>

              {/* Player */}
              <div className="rounded-lg overflow-hidden border mb-6"
                   style={{ borderColor: 'var(--linen)', background: 'var(--bark)' }}>
                {selected.stream_id ? (
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={`https://player.zenstream.live/${selected.stream_id}`}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center"
                       style={{ minHeight: '320px' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                         style={{ background: 'rgba(196,114,74,0.15)' }}>
                      <span className="text-2xl">▶</span>
                    </div>
                    <p className="font-display text-xl font-light mb-1" style={{ color: 'var(--ivory)' }}>
                      No stream linked
                    </p>
                    <p className="text-sm" style={{ color: 'var(--driftwood)' }}>
                      Paste your Zenstream stream ID below to embed the player
                    </p>
                  </div>
                )}
              </div>

              {/* Link Stream Form */}
              <div className="rounded-lg border p-5" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--driftwood)' }}>
                  ZENSTREAM STREAM ID
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
                    className="px-5 py-2 text-sm font-medium rounded-sm transition-opacity disabled:opacity-50 hover:opacity-90 whitespace-nowrap"
                    style={{ background: 'var(--clay)', color: 'var(--white)' }}>
                    {saving ? 'Saving...' : 'Link Stream'}
                  </button>
                </div>
                {saveMsg && (
                  <p className="text-xs mt-2 font-mono" style={{ color: 'var(--moss)' }}>{saveMsg}</p>
                )}
                <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--driftwood)' }}>
                  The stream ID is the last part of your Zenstream player URL:
                  <span className="font-mono ml-1" style={{ color: 'var(--soil)' }}>
                    player.zenstream.live/<strong>your-stream-id</strong>
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
