'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AdminNav } from '@/components/layout/admin-nav'
import { DashboardTab } from '@/components/admin-tabs/dashboard-tab'
import { ClassesTab } from '@/components/admin-tabs/classes-tab'
import { InstructorsTab } from '@/components/admin-tabs/instructors-tab'
import { StreamTab } from '@/components/admin-tabs/stream-tab'

function AdminPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard')

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    router.push(`/admin?tab=${newTab}`)
  }

  return (
    <AdminNav activeTab={activeTab} onTabChange={handleTabChange}>
      <main className="px-8 py-10">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'instructors' && <InstructorsTab />}
        {activeTab === 'stream' && <StreamTab />}
      </main>
    </AdminNav>
  )
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageInner />
    </Suspense>
  )
}
