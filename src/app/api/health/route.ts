import { db } from '@/lib/clients/db'
import { kv } from '@/lib/clients/kv'
import { NextResponse } from 'next/server'

// NOTE - using cdn caching for rate limiting on db calls

export const maxDuration = 10

export async function GET() {
  const checks = {
    kv: false,
    database: false,
  }

  // check kv
  try {
    await kv.ping()
    checks.kv = true
  } catch (error) {
    // kv failed
  }

  // check database
  if (db) {
    try {
      await db`SELECT 1`
      checks.database = true
    } catch (error) {
      // database failed
    }
  }

  const allHealthy = checks.kv && checks.database

  return NextResponse.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        // vercel infra respects this to cache on cdn
        'Cache-Control': 'public, max-age=30, must-revalidate',
      },
    }
  )
}
