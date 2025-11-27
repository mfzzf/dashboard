import 'server-cli-only'

import { db } from '@/lib/clients/db'
import { returnServerError } from '@/lib/utils/action'
import { ClientTeam } from '@/types/dashboard.types'

export const getTeamPure = async (userId: string, teamId: string) => {
  // If no database, return error
  if (!db) {
    return returnServerError('Database not available')
  }

  const userTeamsRelationData = await db`
    SELECT * FROM users_teams
    WHERE user_id = ${userId} AND team_id = ${teamId}
    LIMIT 1
  `

  if (!userTeamsRelationData || userTeamsRelationData.length === 0) {
    return returnServerError('User is not authorized to view this team')
  }

  const relation = userTeamsRelationData[0]!

  const teamData = await db`
    SELECT * FROM teams
    WHERE id = ${teamId}
    LIMIT 1
  `

  if (!teamData || teamData.length === 0) {
    return returnServerError('Team not found')
  }

  const team = teamData[0]

  const clientTeam: ClientTeam = {
    id: team.id,
    name: team.name,
    slug: team.slug,
    email: team.email || '',
    tier: team.tier || 'base_v1',
    is_default: relation.is_default,
    is_banned: team.is_banned || false,
    is_blocked: team.is_blocked || false,
    blocked_reason: team.blocked_reason,
    cluster_id: team.cluster_id,
    profile_picture_url: team.profile_picture_url,
    created_at: team.created_at,
  }

  return clientTeam
}
