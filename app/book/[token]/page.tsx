'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Slot = {
  id: string
  date: string
  start_time: string
  duration_hours: number
  status: 'open' | 'claimed' | 'confirmed'
}

type Instructor = {
  id: string
  name: string
  email: string
}

export default function BookSlot() {
  const params = useParams()
  const token = params.token as string

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimingSlot, setClaimingSlot] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      fetchInstructorAndSlots()
    }
  }, [token])

  const fetchInstructorAndSlots = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch instructor by token
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('*')
        .eq('unique_token', token)
        .single()

      if (instructorError) throw new Error('Invalid token or instructor not found')

      setInstructor(instructorData)

      // Fetch open slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .eq('status', 'open')
        .order('date', { ascending: true })

      if (slotsError) throw slotsError
      setSlots(slotsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimSlot = async (slotId: string) => {
    if (!instructor) return

    try {
      setClaimingSlot(slotId)
      const { error: updateError } = await supabase
        .from('slots')
        .update({
          status: 'claimed',
          instructor_id: instructor.id,
        })
        .eq('id', slotId)

      if (updateError) throw updateError

      setSuccess(true)
      setSlots(slots.filter(s => s.id !== slotId))

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim slot')
    } finally {
      setClaimingSlot(null)
    }
  }

  if (error && !instructor) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-semibold mb-2">Access Denied</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {instructor && (
        <>
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {instructor.name}!
            </h2>
            <p className="text-gray-600">
              Choose an available slot below to book your class.
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              Slot claimed successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {slots.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No open slots available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
                >
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="text-lg font-semibold text-gray-900">{slot.date}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Time</p>
                      <p className="font-medium text-gray-900">{slot.start_time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                      <p className="font-medium text-gray-900">{slot.duration_hours}h</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaimSlot(slot.id)}
                    disabled={claimingSlot === slot.id}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition"
                  >
                    {claimingSlot === slot.id ? 'Claiming...' : 'Claim Slot'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
