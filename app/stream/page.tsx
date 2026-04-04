'use client'

import { useEffect, useState } from 'react'

const LIVE_ID = '2f0b755a35c74028b4c379d8c462c304'

export default function StreamPage() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/vdo-token?liveId=${LIVE_ID}`)
      .then(r => r.json())
      .then(data => {
        if (data.token) setToken(data.token)
        else if (data.otp) setToken(data.otp)
        else setError(data.detail || data.error || 'Could not load stream token')
      })
      .catch(() => setError('Failed to reach token endpoint'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8"
         style={{ background: 'var(--bark)' }}>
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="font-display text-3xl font-light mb-1" style={{ color: 'var(--ivory)' }}>
            JUNOON
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--clay)' }}>
            Live Class
          </p>
        </div>

        {/* Player */}
        <div className="w-full rounded-lg overflow-hidden" style={{ background: '#111' }}>
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6"
                 style={{ minHeight: '360px' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--clay)' }}>
                Stream error
              </p>
              <p className="text-sm" style={{ color: 'var(--driftwood)' }}>{error}</p>
            </div>
          ) : !token ? (
            <div className="flex items-center justify-center" style={{ minHeight: '360px' }}>
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

        <p className="text-center mt-4 font-mono text-[10px] uppercase tracking-widest"
           style={{ color: 'var(--driftwood)' }}>
          VdoCipher Live · {LIVE_ID}
        </p>
      </div>
    </div>
  )
}
