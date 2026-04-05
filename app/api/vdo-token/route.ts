import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET() {
  const liveId = process.env.VDOCIPHER_LIVE_ID
  const apiKey = process.env.VDOCIPHER_API_KEY

  if (!liveId || !apiKey) {
    return NextResponse.json({ error: 'VdoCipher credentials not configured' }, { status: 500 })
  }

  // VdoCipher live-v2 player requires a JWT signed with your API secret
  const token = jwt.sign(
    { liveId },
    apiKey,
    { expiresIn: '6h' }
  )

  return NextResponse.json({ token, liveId })
}
