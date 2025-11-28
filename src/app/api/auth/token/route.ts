import { getE2BApiKey } from '@/configs/api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const token = getE2BApiKey()
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json(
      { error: 'Token not configured' },
      { status: 500 }
    )
  }
}
