import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Junoon Scheduler',
  description: 'Instructor scheduling for Junoon Wellness',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
