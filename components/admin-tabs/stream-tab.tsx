'use client'

import { useEffect, useState } from 'react'

export function StreamTab() {
  const [token, setToken] = useState<string | null>(null)
  const [liveId, setLiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/vdo-token')
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          setToken(data.token)
          setLiveId(data.liveId)
        } else {
          setError(data.detail || data.error || 'Could not load stream token')
        }
      })
      .catch(() => setError('Failed to reach token endpoint'))
  }, [])

  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--clay)' }}>
          LIVE BROADCAST
        </p>
        <h1 className="font-display text-4xl font-light mb-1" style={{ color: 'var(--bark)' }}>
          Stream
        </h1>
        <p className="text-sm" style={{ color: 'var(--driftwood)' }}>
          VdoCipher live player for testing
        </p>
      </div>

      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--linen)' }}>
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
              src={`https://player.vdocipher.com/live-v2?liveId=${liveId}&token=${token}`}
              style={{ border: 0, width: '100%', aspectRatio: '16/9', display: 'block' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t"
             style={{ borderColor: 'var(--linen)', background: 'var(--white)' }}>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full" style={{ background: token ? 'var(--sage)' : 'var(--driftwood)' }} />
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--driftwood)' }}>
              {token ? 'Stream active' : error ? 'Token failed' : 'Fetching...'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
