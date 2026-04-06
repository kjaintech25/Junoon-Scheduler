import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slotId } = body

    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 })
    }

    // Fetch slot with instructor info
    const { data: slot, error: fetchError } = await supabase
      .from('slots')
      .select(`*, instructor:instructors(name)`)
      .eq('id', slotId)
      .single()

    if (fetchError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    // Fire-and-forget sync to website
    const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://junoon-bhargava-next.vercel.app'
    const SYNC_SECRET = process.env.WEBSITE_SYNC_SECRET || ''

    if (SYNC_SECRET) {
      const payload = {
        slot_id: slot.id,
        title: `${slot.class_type || 'Vinyasa'} Class`,
        instructor: (slot.instructor as { name: string } | null)?.name ?? 'TBD',
        starts_at: `${slot.date}T${slot.start_time}`,
        duration_minutes: Math.round(slot.duration_hours * 60),
        level: 'All Levels',
        tags: [slot.class_type || 'Vinyasa'],
        image_url: (slot as any).image_url || '',
        stream_id: slot.stream_id || null,
        is_published: (slot as any).is_published ?? true,
      }

      fetch(`${WEBSITE_URL}/api/sync-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Secret': SYNC_SECRET,
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('Website sync failed:', err)
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
