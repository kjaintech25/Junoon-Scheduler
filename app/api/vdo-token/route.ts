import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  const liveId = req.nextUrl.searchParams.get('liveId')
  if (!liveId) {
    return NextResponse.json({ error: 'liveId required' }, { status: 400 })
  }

  const apiKey = process.env.VDOCIPHER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  // VdoCipher live-v2 player requires a JWT signed with your API secret
  const token = jwt.sign(
    { liveId },
    apiKey,
    { expiresIn: '6h' }
  )

  return NextResponse.json({ token })
}
