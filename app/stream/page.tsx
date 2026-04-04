export default function StreamPage() {
  const liveId = '2f0b755a35c74028b4c379d8c462c304'

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
        <div className="w-full rounded-lg overflow-hidden">
          <iframe
            src={`https://player.vdocipher.com/live-v2?liveId=${liveId}&token=`}
            style={{ border: 0, width: '100%', aspectRatio: '16/9', maxWidth: '100%', display: 'block' }}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>

        <p className="text-center mt-4 font-mono text-[10px] uppercase tracking-widest"
           style={{ color: 'var(--driftwood)' }}>
          VdoCipher · Live ID: {liveId}
        </p>
      </div>
    </div>
  )
}
