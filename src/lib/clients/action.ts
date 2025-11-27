import { getTeamIdFromSegment } from '@/server/team/get-team-id-from-segment'
import { UnknownError } from '@/types/errors'
import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { createMiddleware, createSafeActionClient } from 'next-safe-action'
import { unauthorized } from 'next/navigation'
import { serializeError } from 'serialize-error'
import { z } from 'zod'
import { ActionError, flattenClientInputValue } from '../utils/action'
import { l } from './logger/logger'
import { getTracer } from './tracer'

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    const s = trace.getActiveSpan()

    s?.setStatus({ code: SpanStatusCode.ERROR })
    s?.recordException(e)

    // part of our strategy how to leak errors to a user
    if (e instanceof ActionError) {
      return e.message
    }

    const sE = serializeError(e)

    l.error(
      {
        key: 'action_client:unexpected_server_error',
        error: sE,
      },
      `${sE.name && `${sE.name}: `} ${sE.message || 'Unknown error'}`
    )

    return UnknownError().message
  },
  defineMetadataSchema() {
    return z
      .object({
        actionName: z.string().optional(),
        serverFunctionName: z.string().optional(),
      })
      .refine((data) => {
        if (!data.actionName && !data.serverFunctionName) {
          return 'actionName or serverFunctionName is required in definition metadata'
        }
        return true
      })
  },
  defaultValidationErrorsShape: 'flattened',
}).use(async ({ next, clientInput, metadata }) => {
  const t = getTracer()

  const actionOrFunctionName =
    metadata?.serverFunctionName || metadata?.actionName || 'Unknown action'

  const type = metadata?.serverFunctionName ? 'function' : 'action'
  const name = actionOrFunctionName

  const s = t.startSpan(`${type}:${name}`)

  const startTime = performance.now()

  const result = await context.with(
    trace.setSpan(context.active(), s),
    async () => {
      return next()
    }
  )

  const duration = performance.now() - startTime

  const baseLogPayload = {
    server_function_type: type,
    server_function_name: name,
    server_function_input: clientInput,
    server_function_duration_ms: duration.toFixed(3),

    team_id: flattenClientInputValue(clientInput, 'teamId'),
    template_id: flattenClientInputValue(clientInput, 'templateId'),
    sandbox_id: flattenClientInputValue(clientInput, 'sandboxId'),
    user_id: flattenClientInputValue(clientInput, 'userId'),
  }

  s.setAttribute('server_function_type', type)
  s.setAttribute('server_function_name', name)
  s.setAttribute(
    'server_function_duration_ms',
    baseLogPayload.server_function_duration_ms
  )
  if (baseLogPayload.team_id) {
    s.setAttribute('team_id', baseLogPayload.team_id)
  }
  if (baseLogPayload.template_id) {
    s.setAttribute('template_id', baseLogPayload.template_id)
  }
  if (baseLogPayload.sandbox_id) {
    s.setAttribute('sandbox_id', baseLogPayload.sandbox_id)
  }
  if (baseLogPayload.user_id) {
    s.setAttribute('user_id', baseLogPayload.user_id)
  }

  const error = result.serverError || result.validationErrors

  if (error) {
    s.setStatus({ code: SpanStatusCode.ERROR })
    s.recordException(error)

    const sE = serializeError(error)

    l.error(
      {
        key: 'action_client:failure',
        ...baseLogPayload,
        error: sE,
      },
      `${type} ${name} failed in ${baseLogPayload.server_function_duration_ms}ms: ${typeof sE === 'string' ? sE : ((sE.name || sE.code) && `${sE.name || sE.code}: ` + sE.message) || 'Unknown error'}`
    )
  } else {
    s.setStatus({ code: SpanStatusCode.OK })

    l.info(
      {
        key: `action_client:success`,
        ...baseLogPayload,
      },
      `${type} ${name} succeeded in ${baseLogPayload.server_function_duration_ms}ms`
    )
  }

  s.end()

  return result
})

/**
 * Mock session for backward compatibility (no real user auth)
 */
const mockSession = {
  access_token: process.env.E2B_ACCESS_TOKEN || '',
  refresh_token: '',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'system',
    email: 'system@e2b.dev',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
}

/**
 * Mock user for backward compatibility (no real user auth)
 */
const mockUser = mockSession.user

/**
 * Auth action client - now uses E2B_ACCESS_TOKEN instead of Supabase auth.
 * Provides mock session/user context for backward compatibility.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  return next({
    ctx: {
      user: mockUser,
      session: mockSession,
    },
  })
})

/**
 * Middleware that automatically resolves team ID from teamIdOrSlug.
 * No user authentication required - uses E2B_ACCESS_TOKEN from environment.
 */
export const withTeamIdResolution = createMiddleware<{
  ctx: {
    user: typeof mockUser
    session: typeof mockSession
  }
}>().define(async ({ next, clientInput }) => {
  if (
    !clientInput ||
    typeof clientInput !== 'object' ||
    !('teamIdOrSlug' in clientInput)
  ) {
    l.error(
      {
        key: 'with_team_id_resolution:missing_team_id_or_slug',
        context: {
          teamIdOrSlug: (clientInput as { teamIdOrSlug?: string })?.teamIdOrSlug,
        },
      },
      'Missing teamIdOrSlug when using withTeamIdResolution middleware'
    )

    throw new Error(
      'teamIdOrSlug is required when using withTeamIdResolution middleware'
    )
  }

  const teamId = await getTeamIdFromSegment(clientInput.teamIdOrSlug as string)

  if (!teamId) {
    l.warn(
      {
        key: 'with_team_id_resolution:invalid_team_id_or_slug',
        context: {
          teamIdOrSlug: clientInput.teamIdOrSlug,
        },
      },
      `with_team_id_resolution:invalid_team_id_or_slug - invalid team id or slug provided through withTeamIdResolution middleware: ${clientInput.teamIdOrSlug}`
    )

    throw unauthorized()
  }

  return next({
    ctx: { teamId },
  })
})
