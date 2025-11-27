import { getTracer } from '@/lib/clients/tracer'
import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { t } from '../init'

/**
 * Mock session for backward compatibility (no real user auth)
 * Uses E2B_ACCESS_TOKEN from environment
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

export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const tracer = getTracer()

  const span = tracer.startSpan('trpc.middleware.auth')
  span.setAttribute('trpc.middleware.name', 'auth')

  try {
    // No real authentication - use mock session/user
    // Authentication is handled via E2B_ACCESS_TOKEN in API calls
    await context.with(trace.setSpan(context.active(), span), async () => {
      // Just a placeholder for telemetry
      return Promise.resolve()
    })

    span.setStatus({ code: SpanStatusCode.OK })

    return next({
      ctx: {
        ...ctx,
        session: mockSession,
        user: mockUser,
      },
    })
  } finally {
    span.end()
  }
})
