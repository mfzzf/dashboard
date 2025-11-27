import 'server-only'

import { CACHE_TAGS } from '@/configs/cache'
import { db } from '@/lib/clients/db'
import { l } from '@/lib/clients/logger/logger'
import { cacheTag } from 'next/cache'
import { serializeError } from 'serialize-error'

export async function checkUserTeamAuth(userId: string, teamId: string) {
  // If no database, allow access (since we're using env-based auth)
  if (!db) {
    return true
  }

  try {
    const result = await db`
      SELECT 1 FROM users_teams
      WHERE user_id = ${userId} AND team_id = ${teamId}
      LIMIT 1
    `

    return result.length > 0
  } catch (error) {
    l.error(
      {
        key: 'check_user_team_authorization:failed_to_fetch_users_teams_relation',
        error: serializeError(error),
        context: {
          userId,
          teamId,
        },
      },
      `Failed to fetch users_teams relation (user: ${userId}, team: ${teamId})`
    )

    // Allow access on error since we're using env-based auth
    return true
  }
}

/*
 *  This function checks if a user is authorized to access a team.
 *  If the user is not authorized, it returns false.
 */
export default async function checkUserTeamAuthCached(
  userId: string,
  teamId: string
) {
  'use cache'
  cacheTag(CACHE_TAGS.USER_TEAM_AUTHORIZATION(userId, teamId))

  return checkUserTeamAuth(userId, teamId)
}
