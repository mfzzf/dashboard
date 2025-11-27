import 'server-cli-only'

import { db } from '@/lib/clients/db'
import { l } from '@/lib/clients/logger/logger'
import { serializeError } from 'serialize-error'

export async function getDefaultTeamRelation(userId: string) {
  if (!db) {
    throw new Error('Database not available')
  }

  try {
    const data = await db`
      SELECT * FROM users_teams
      WHERE user_id = ${userId} AND is_default = true
      LIMIT 1
    `

    if (!data || data.length === 0) {
      throw new Error('No default team found')
    }

    return data[0]!
  } catch (error) {
    l.error({
      key: 'get_default_team_relation:error',
      error: serializeError(error),
      user_id: userId,
    })
    throw new Error('No default team found')
  }
}

export async function getDefaultTeam(userId: string) {
  if (!db) {
    throw new Error('Database not available')
  }

  try {
    const data = await db`
      SELECT ut.team_id, t.id, t.name, t.slug
      FROM users_teams ut
      JOIN teams t ON ut.team_id = t.id
      WHERE ut.user_id = ${userId} AND ut.is_default = true
      LIMIT 1
    `

    if (!data || data.length === 0) {
      throw new Error('No default team found')
    }

    return {
      id: data[0].id,
      name: data[0].name,
      slug: data[0].slug,
    }
  } catch (error) {
    l.error({
      key: 'GET_DEFAULT_TEAM:ERROR',
      error: serializeError(error),
      user_id: userId,
    })
    throw new Error('No default team found')
  }
}
