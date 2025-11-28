import 'server-only'

import { BEARER_AUTH_HEADERS } from '@/configs/api'
import { CACHE_TAGS } from '@/configs/cache'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { TeamIdOrSlugSchema } from '@/lib/schemas/team'
import { cacheLife } from 'next/dist/server/use-cache/cache-life'
import { cacheTag } from 'next/dist/server/use-cache/cache-tag'
import { serializeError } from 'serialize-error'

export const getTeamIdFromSegment = async (segment: string) => {
  'use cache'
  cacheLife('default')
  cacheTag(CACHE_TAGS.TEAM_ID_FROM_SEGMENT(segment))

  if (!TeamIdOrSlugSchema.safeParse(segment).success) {
    l.warn(
      {
        key: 'get_team_id_from_segment:invalid_segment',
        context: {
          segment,
        },
      },
      'get_team_id_from_segment - invalid segment'
    )

    return null
  }

  try {
    const res = await infra.GET('/teams', {
      headers: BEARER_AUTH_HEADERS(),
    })

    if (res.error || !res.data) {
      l.warn(
        {
          key: 'get_team_id_from_segment:failed_to_fetch_teams',
          error: serializeError(res.error),
          context: { segment },
        },
        'get_team_id_from_segment - failed to fetch teams'
      )
      return null
    }

    // Find team by ID or name (slug) - decode URL encoded characters
    const decodedSegment = decodeURIComponent(segment)
    const team = res.data.find(
      (t: { teamID: string; name: string }) =>
        t.teamID === segment ||
        t.teamID === decodedSegment ||
        t.name === segment ||
        t.name === decodedSegment
    )

    if (!team) {
      l.warn(
        {
          key: 'get_team_id_from_segment:team_not_found',
          context: { segment },
        },
        `get_team_id_from_segment - team not found: ${segment}`
      )
      return null
    }

    return team.teamID
  } catch (error) {
    l.error(
      {
        key: 'get_team_id_from_segment:exception',
        error: serializeError(error),
        context: { segment },
      },
      'get_team_id_from_segment - exception'
    )
    return null
  }
}
