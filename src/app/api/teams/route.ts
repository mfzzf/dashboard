import { AUTH_HEADERS } from '@/configs/api'
import { infra } from '@/lib/clients/api'
import { ClientTeam } from '@/types/dashboard.types'
import { TeamsResponse } from './types'

export async function GET() {
  try {
    const res = await infra.GET('/teams', {
      headers: AUTH_HEADERS(),
    })

    if (res.error || !res.data) {
      return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // Convert to ClientTeam format
    const teams: ClientTeam[] = res.data.map(
      (team: { teamID: string; name: string; isDefault?: boolean }) => ({
        id: team.teamID,
        name: team.name,
        slug: team.name,
        email: '',
        tier: 'base_v1',
        is_default: team.isDefault ?? false,
        is_banned: false,
        is_blocked: false,
        blocked_reason: null,
        cluster_id: null,
        profile_picture_url: null,
        created_at: new Date().toISOString(),
      })
    )

    return Response.json({ teams } satisfies TeamsResponse)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
