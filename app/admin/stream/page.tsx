'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LIVE_ID = '2f0b755a35c74028b4c379d8c462c304'

export default function AdminStreamPage() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/vdo-token?liveId=${LIVE_ID}`)
      .then(r => r.json())
      .then(data => {
        if (data.token) setToken(data.token)
        else setError(data.detail || data.error || 'Could not load stream token')
      })
      .catch(() => setError('Failed to reach token endpoint'))
  }, [])

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Schedule', href: '/admin/slots' },
    { label: 'Classes', href: '/admin/classes' },
    { label: 'Stream', href: '/admin/stream' },
    { label: 'Instructors', href: '#' },
    { label: 'Settings', href: '#' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Top Nav */}
      <nav className="border-b px-8 h-14 flex items-center justify-between sticky top-0 z-50"
           style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <span className="font-display text-xl font-light tracking-wide" style={{ color: 'var(--bark)' }}>
          JUNOON
        </span>
        <div className="flex items-center gap-8">
          {navItems.map(({ label, href }) => (
            <Link key={label} href={href}
              className="text-sm font-medium relative"
              style={{ color: label === 'Stream' ? 'var(--clay)' : 'var(--driftwood)' }}>
              {label}
              {label === 'Stream' && (
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

      {/* Page Content */}
      <div className="px-8 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
            LIVE BROADCAST
          </p>
          <h1 className="font-display text-4xl font-light" style={{ color: 'var(--bark)' }}>
            Stream
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--driftwood)' }}>
            Live class player for administrators
          </p>
        </div>

        {/* Player Card */}
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--linen)' }}>
          {/* Dark player area */}
          <div style={{ background: 'var(--bark)' }}>
            {error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--clay)' }}>
                  Stream error
                </p>
                <p className="text-sm" style={{ color: 'var(--driftwood)' }}>{error}</p>
              </div>
            ) : !token ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-4"
                     style={{ borderColor: 'var(--clay)', borderTopColor: 'transparent' }} />
                <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>
                  Loading stream...
                </p>
              </div>
            ) : (
              <iframe
                src={`https://player.vdocipher.com/live-v2?liveId=${LIVE_ID}&token=${token}`}
                style={{ border: 0, width: '100%', aspectRatio: '16/9', display: 'block' }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
          </div>

          {/* Stream Info bar */}
          <div className="px-5 py-3 flex items-center justify-between border-t"
               style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ background: token ? 'var(--sage)' : 'var(--driftwood)' }} />
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>
                {token ? 'Token active' : error ? 'Token failed' : 'Fetching token...'}
              </p>
            </div>
            <p className="font-mono text-[10px] truncate max-w-xs" style={{ color: 'var(--driftwood)' }}>
              {LIVE_ID}
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 px-4 py-3 rounded-sm border" style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
          <p className="text-xs" style={{ color: 'var(--driftwood)' }}>
            <span className="font-mono uppercase tracking-wider text-[9px]" style={{ color: 'var(--bark)' }}>Note — </span>
            The stream token is generated securely on the server and expires in 6 hours. Refresh the page to get a new token.
          </p>
        </div>
      </div>
    </div>
  )
}
