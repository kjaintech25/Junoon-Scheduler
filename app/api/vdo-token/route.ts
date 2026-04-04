import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const liveId = req.nextUrl.searchParams.get('liveId')
  if (!liveId) {
    return NextResponse.json({ error: 'liveId required' }, { status: 400 })
  }

  const apiKey = process.env.VDOCIPHER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const res = await fetch(`https://api.vdocipher.com/api/live/${liveId}/otp`, {
    method: 'POST',
    headers: {
      Authorization: `Apisecret ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'VdoCipher error', detail: text }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
