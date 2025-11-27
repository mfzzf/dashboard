import { PROTECTED_URLS } from '@/configs/urls'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Redirect to dashboard - account settings not available without user auth
  return NextResponse.redirect(new URL(PROTECTED_URLS.DASHBOARD, request.url))
}
