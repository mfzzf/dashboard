import { db } from '@/lib/clients/db'
import { l } from '@/lib/clients/logger/logger'
import { createTRPCRouter } from '../init'
import { protectedTeamProcedure } from '../procedures'

export const teamsRouter = createTRPCRouter({
  getLimits: protectedTeamProcedure.query(async ({ ctx }) => {
    const { teamId, user } = ctx

    if (!db) {
      l.warn({
        key: 'teams:get_limits:no_db',
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

    const result = await db`
      SELECT concurrent_sandboxes, disk_mb, max_length_hours, max_ram_mb, max_vcpu
      FROM team_limits
      WHERE id = ${teamId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      l.error(
        {
          key: 'teams:get_limits:no_team_limits_found',
          team_id: teamId,
          user_id: user.id,
        },
        `no team_limits found for team: ${teamId}`
      )

      return null
    }

    const teamData = result[0]
    return {
      concurrentInstances: teamData.concurrent_sandboxes || 0,
      diskMb: teamData.disk_mb || 0,
      maxLengthHours: teamData.max_length_hours || 0,
      maxRamMb: teamData.max_ram_mb || 0,
      maxVcpu: teamData.max_vcpu || 0,
    }
  }),
})
