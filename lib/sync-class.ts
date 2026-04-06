import { supabaseAdmin } from './supabase-admin'

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://junoon-bhargava-next.vercel.app'
const SYNC_SECRET = process.env.WEBSITE_SYNC_SECRET || ''

export async function syncClassToWebsite(slotId: string) {
  if (!SYNC_SECRET) {
    console.warn('WEBSITE_SYNC_SECRET not set — skipping website sync')
    return
  }

  // 1. Fetch slot details with instructor name
  const { data: slot, error: slotError } = await supabaseAdmin
    .from('slots')
    .select(`
      *,
      instructor:instructors(name)
    `)
    .eq('id', slotId)
    .single()

  if (slotError || !slot) {
    console.error('Failed to fetch slot for sync:', slotError)
    return
  }

  if (slot.status !== 'confirmed') {
    console.log('Slot not confirmed, skipping sync:', slotId)
    return
  }

  // 2. POST to website sync endpoint
  const payload = {
    slot_id: slot.id,
    title: `${slot.class_type || 'Vinyasa'} Class`,
    instructor: (slot.instructor as { name: string } | null)?.name || 'TBD',
    starts_at: `${slot.date}T${slot.start_time}`,
    duration_minutes: slot.duration_hours * 60,
    level: 'All Levels',
    tags: [slot.class_type || 'Vinyasa'],
    image_url: (slot as any).image_url || '',
    stream_id: slot.stream_id || null,
    is_published: (slot as any).is_published ?? true,
  }

  try {
    const res = await fetch(`${WEBSITE_URL}/api/sync-class`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Website sync failed:', res.status, text)
    } else {
      console.log('Website sync OK for slot:', slotId)
    }
  } catch (err) {
    console.error('Website sync request failed:', err)
  }
}
