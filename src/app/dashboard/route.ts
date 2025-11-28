import { BEARER_AUTH_HEADERS } from '@/configs/api'
import { PROTECTED_URLS } from '@/configs/urls'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { setTeamCookies } from '@/lib/utils/cookies'
import { NextRequest, NextResponse } from 'next/server'

export const TAB_URL_MAP: Record<string, (teamId: string) => string> = {
  sandboxes: (teamId) => PROTECTED_URLS.SANDBOXES(teamId),
  templates: (teamId) => PROTECTED_URLS.TEMPLATES(teamId),
  usage: (teamId) => PROTECTED_URLS.USAGE(teamId),
  billing: (teamId) => PROTECTED_URLS.BILLING(teamId),
  budget: (teamId) => PROTECTED_URLS.BUDGET(teamId),
  keys: (teamId) => PROTECTED_URLS.KEYS(teamId),
  settings: (teamId) => PROTECTED_URLS.GENERAL(teamId),
  team: (teamId) => PROTECTED_URLS.GENERAL(teamId),
  members: (teamId) => PROTECTED_URLS.MEMBERS(teamId),
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tab = searchParams.get('tab')

  // Get teams from infra API (requires Bearer token auth)
  const res = await infra.GET('/teams', {
    headers: BEARER_AUTH_HEADERS(),
  })

  l.info({
    key: 'dashboard:teams_response',
    status: res.response?.status,
    error: res.error,
    data: res.data,
    headers: BEARER_AUTH_HEADERS(),
  })

  if (res.error || !res.data || res.data.length === 0) {
    l.warn({
      key: 'dashboard:no_teams',
      error: res.error,
      status: res.response?.status,
    })
    // No teams available - show error page
    return NextResponse.redirect(new URL('/dashboard/not-found', request.url))
  }

  // Use first team (or default team if available)
  const team =
    res.data.find(
      (t: { isDefault?: boolean }) => t.isDefault
    ) || res.data[0]

  const teamSlug = team.name

  // Set team cookies for persistence
  await setTeamCookies(team.teamID, teamSlug)

  // Determine redirect path based on tab parameter
  const urlGenerator = tab ? TAB_URL_MAP[tab] : null
  const redirectPath = urlGenerator
    ? urlGenerator(teamSlug)
    : PROTECTED_URLS.SANDBOXES(teamSlug)

  return NextResponse.redirect(new URL(redirectPath, request.url))
}
