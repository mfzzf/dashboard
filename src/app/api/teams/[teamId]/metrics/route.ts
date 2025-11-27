import 'server-cli-only'

import { getE2BAccessToken } from '@/configs/api'
import { l } from '@/lib/clients/logger/logger'
import { getTeamMetricsCore } from '@/server/sandboxes/get-team-metrics-core'
import { serializeError } from 'serialize-error'
import { TeamMetricsRequestSchema, TeamMetricsResponse } from './types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    const parsedInput = TeamMetricsRequestSchema.safeParse(await request.json())

    if (!parsedInput.success) {
      l.warn(
        {
          key: 'team_metrics_route_handler:invalid_request',
          error: serializeError(parsedInput.error),
          team_id: teamId,
          context: {
            request: parsedInput.data,
          },
        },
        'team_metrics_route_handler: invalid request'
      )

      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { start: startMs, end: endMs } = parsedInput.data

    // Use E2B_ACCESS_TOKEN from environment instead of session
    const accessToken = getE2BAccessToken()

    const result = await getTeamMetricsCore({
      accessToken,
      teamId,
      userId: 'system',
      startMs,
      endMs,
    })

    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json(result.data! satisfies TeamMetricsResponse)
  } catch (error) {
    l.error({
      key: 'team_metrics_route_handler:unexpected_error',
      error: serializeError(error),
    })

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
