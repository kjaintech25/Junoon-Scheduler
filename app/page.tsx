'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed'
  instructor_id: string | null
}

export default function Dashboard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('slots')
        .select('*')
        .order('date', { ascending: true })

      if (fetchError) throw fetchError
      setSlots(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slots')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 border-green-300'
      case 'claimed':
        return 'bg-yellow-100 border-yellow-300'
      case 'confirmed':
        return 'bg-blue-100 border-blue-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (error) {
    return <div className="text-red-600 p-4">Error: {error}</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">All available slots</p>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading slots...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No slots created yet</p>
          <a href="/admin/create-slot" className="text-blue-600 hover:text-blue-800 font-medium">
            Create your first slot →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`border-2 rounded-lg p-4 ${getStatusColor(slot.status)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">{slot.date}</p>
                </div>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold">
                  {getStatusLabel(slot.status)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">{slot.start_time}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">{slot.duration_hours}h</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
