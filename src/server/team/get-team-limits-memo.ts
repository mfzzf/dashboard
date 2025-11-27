import 'server-cli-only'

import { db } from '@/lib/clients/db'
import { l } from '@/lib/clients/logger/logger'
import { cache } from 'react'
import { serializeError } from 'serialize-error'
import type { TeamLimits } from './get-team-limits'

/**
 * Internal function to fetch team limits from the database using direct PostgreSQL
 */
async function _getTeamLimits(
  teamId: string,
  userId: string
): Promise<TeamLimits | null> {
  if (!db) {
    l.warn({
      key: 'get_team_limits_memo:no_db',
      message: 'Database not available, returning default limits',
      team_id: teamId,
    })
    // Return default limits if database is not available
    return {
      concurrentInstances: 100,
      diskMb: 10240,
      maxLengthHours: 24,
      maxRamMb: 8192,
      maxVcpu: 8,
    }
  }

  try {
    const result = await db`
      SELECT concurrent_sandboxes, disk_mb, max_length_hours, max_ram_mb, max_vcpu
      FROM team_limits
      WHERE id = ${teamId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      l.warn({
        key: 'get_team_limits_memo:no_team_data',
        message: 'No data found for team, returning defaults',
        team_id: teamId,
      })
      return {
        concurrentInstances: 100,
        diskMb: 10240,
        maxLengthHours: 24,
        maxRamMb: 8192,
        maxVcpu: 8,
      }
    }

    const teamData = result[0]!
    return {
      concurrentInstances: teamData.concurrent_sandboxes || 0,
      diskMb: teamData.disk_mb || 0,
      maxLengthHours: teamData.max_length_hours || 0,
      maxRamMb: teamData.max_ram_mb || 0,
      maxVcpu: teamData.max_vcpu || 0,
    }
  } catch (error) {
    l.error({
      key: 'get_team_limits_memo:unexpected_error',
      message: 'Unexpected error fetching team limits',
      error: serializeError(error),
      team_id: teamId,
      user_id: userId,
    })
    return null
  }
}

const getTeamLimitsMemo = cache(_getTeamLimits)

export default getTeamLimitsMemo
