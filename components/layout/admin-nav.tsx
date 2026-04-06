'use client'

import Link from 'next/link'

interface AdminNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children?: React.ReactNode
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'classes', label: 'Classes' },
  { id: 'instructors', label: 'Instructors' },
  { id: 'stream', label: 'Stream' },
]

export function AdminNav({ activeTab, onTabChange, children }: AdminNavProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Top Nav */}
      <nav className="border-b px-8 h-14 flex items-center justify-between sticky top-0 z-50"
           style={{ background: 'var(--white)', borderColor: 'var(--linen)' }}>
        <Link href="/admin" className="font-display text-xl font-light tracking-wide hover:opacity-80 transition-opacity"
              style={{ color: 'var(--bark)', textDecoration: 'none' }}>
          JUNOON
        </Link>
        <div className="flex items-center gap-6">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="text-sm font-medium relative bg-transparent border-none outline-none cursor-pointer transition-colors"
              style={{
                color: activeTab === id ? 'var(--clay)' : 'var(--driftwood)',
              }}
            >
              {label}
              {activeTab === id && (
                <span className="absolute -bottom-[17px] left-0 right-0 h-[2px]"
                      style={{ background: 'var(--clay)' }} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {children}
    </div>
  )
}
