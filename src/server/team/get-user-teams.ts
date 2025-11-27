import 'server-cli-only'

import { db } from '@/lib/clients/db'
import { l } from '@/lib/clients/logger/logger'
import { ClientTeam } from '@/types/dashboard.types'
import { User } from '@supabase/supabase-js'
import { serializeError } from 'serialize-error'

export async function getUserTeams(user: User): Promise<ClientTeam[]> {
  // If no database, return empty array (teams will be fetched from infra API)
  if (!db) {
    return []
  }

  try {
    const usersTeamsData = await db`
      SELECT ut.*, t.*
      FROM users_teams ut
      JOIN teams t ON ut.team_id = t.id
      WHERE ut.user_id = ${user.id}
    `

    if (!usersTeamsData || usersTeamsData.length === 0) {
      return []
    }

    return usersTeamsData.map((row) => ({
      id: row.team_id,
      name: row.name,
      slug: row.slug,
      email: row.email || '',
      tier: row.tier || 'base_v1',
      is_default: row.is_default,
      is_banned: row.is_banned || false,
      is_blocked: row.is_blocked || false,
      blocked_reason: row.blocked_reason,
      cluster_id: row.cluster_id,
      profile_picture_url: row.profile_picture_url,
      created_at: row.created_at,
    }))
  } catch (err) {
    l.error({
      key: 'get_user_teams:unexpected_error',
      error: serializeError(err),
      user_id: user.id,
    })
    return []
  }
}
