import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://junoon-bhargava-next.vercel.app',
    'http://localhost:3000',
  ]

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers })
  }

  const liveId = process.env.VDOCIPHER_LIVE_ID
  const apiKey = process.env.VDOCIPHER_API_KEY

  if (!liveId || !apiKey) {
    return NextResponse.json({ error: 'VdoCipher credentials not configured' }, { status: 500, headers })
  }

  const token = jwt.sign(
    { liveId },
    apiKey,
    { expiresIn: '6h' }
  )

  return NextResponse.json({ token, liveId }, { headers })
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://junoon-bhargava-next.vercel.app',
    'http://localhost:3000',
  ]
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return NextResponse.json({}, { headers })
}