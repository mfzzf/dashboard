import 'server-only'

import { AUTH_HEADERS } from '@/configs/api'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { ClientTeam } from '@/types/dashboard.types'
import { cache } from 'react'

/**
 * Get team data from infra API using E2B_ACCESS_TOKEN
 * No user authentication required
 */
async function getTeamFromInfraPure(
  teamIdOrSlug: string
): Promise<ClientTeam | null> {
  try {
    const res = await infra.GET('/teams', {
      headers: AUTH_HEADERS(),
    })

    if (res.error || !res.data) {
      l.error(
        {
          key: 'get_team_from_infra:error',
          error: res.error,
          context: { teamIdOrSlug },
        },
        `Failed to fetch teams from infra API`
      )
      return null
    }

    // Find team by ID or slug (name) - decode URL encoded characters
    const decodedSlug = decodeURIComponent(teamIdOrSlug)
    const team = res.data.find(
      (t: { teamID: string; name: string }) =>
        t.teamID === teamIdOrSlug ||
        t.teamID === decodedSlug ||
        t.name === teamIdOrSlug ||
        t.name === decodedSlug
    )

    if (!team) {
      l.warn(
        {
          key: 'get_team_from_infra:not_found',
          context: { teamIdOrSlug },
        },
        `Team not found: ${teamIdOrSlug}`
      )
      return null
    }

    // Convert to ClientTeam format (matching database.types.ts teams table)
    const clientTeam: ClientTeam = {
      id: team.teamID,
      name: team.name,
      slug: team.name, // Use name as slug
      email: '',
      tier: 'base_v1',
      is_default: team.isDefault ?? false,
      is_banned: false,
      is_blocked: false,
      blocked_reason: null,
      cluster_id: null,
      profile_picture_url: null,
      created_at: new Date().toISOString(),
    }

    return clientTeam
  } catch (error) {
    l.error(
      {
        key: 'get_team_from_infra:exception',
        error,
        context: { teamIdOrSlug },
      },
      `Exception while fetching team from infra API`
    )
    return null
  }
}

export const getTeamFromInfra = cache(getTeamFromInfraPure)
