import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { CACHE_TAGS } from '@/configs/cache'
import { USE_MOCK_DATA } from '@/configs/flags'
import {
  MOCK_DEFAULT_TEMPLATES_DATA,
  MOCK_TEMPLATES_DATA,
} from '@/configs/mock-data'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import { TRPCError } from '@trpc/server'
import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { apiError } from '../errors'
import { createTRPCRouter } from '../init'
import { protectedProcedure, protectedTeamProcedure } from '../procedures'

export const templatesRouter = createTRPCRouter({
  // QUERIES

  getTemplates: protectedTeamProcedure.query(async ({ ctx }) => {
    const { session, teamId } = ctx

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return {
        templates: MOCK_TEMPLATES_DATA,
      }
    }

    const res = await infra.GET('/templates', {
      params: {
        query: {
          teamID: teamId,
        },
      },
      headers: {
        ...SUPABASE_AUTH_HEADERS(session.access_token),
      },
    })

    if (!res.response.ok || res.error) {
      const status = res.response.status

      l.error(
        {
          key: 'trpc:templates:get_team_templates:infra_error',
          error: res.error,
          team_id: teamId,
          user_id: session.user.id,
          context: {
            status,
          },
        },
        `failed to fetch /templates: ${res.error?.message || 'Unknown error'}`
      )

      throw apiError(status)
    }

    return {
      templates: res.data,
    }
  }),

  getDefaultTemplatesCached: protectedProcedure.query(async () => {
    return getDefaultTemplatesCached()
  }),

  // MUTATIONS

  deleteTemplate: protectedTeamProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { session, teamId } = ctx
      const { templateId } = input

      const res = await infra.DELETE('/templates/{templateID}', {
        params: {
          path: {
            templateID: templateId,
          },
        },
        headers: {
          ...SUPABASE_AUTH_HEADERS(session.access_token),
        },
      })

      if (!res.response.ok || res.error) {
        const status = res.response.status

        l.error(
          {
            key: 'trpc:templates:delete_template:infra_error',
            error: res.error,
            user_id: session.user.id,
            team_id: teamId,
            template_id: templateId,
            context: {
              status,
            },
          },
          `failed to delete /templates/{templateID}: ${res.error?.message || 'Unknown error'}`
        )

        if (status === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        if (
          status === 400 &&
          res.error?.message?.includes(
            'because there are paused sandboxes using it'
          )
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot delete template because there are paused sandboxes using it',
          })
        }

        throw apiError(status)
      }

      return { success: true }
    }),

  updateTemplate: protectedTeamProcedure
    .input(
      z.object({
        templateId: z.string(),
        public: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { session, teamId } = ctx
      const { templateId, public: isPublic } = input

      const res = await infra.PATCH('/templates/{templateID}', {
        body: {
          public: isPublic,
        },
        params: {
          path: {
            templateID: templateId,
          },
        },
        headers: {
          ...SUPABASE_AUTH_HEADERS(session.access_token),
        },
      })

      if (!res.response.ok || res.error) {
        const status = res.response.status

        l.error(
          {
            key: 'trpc:templates:update_template:infra_error',
            error: res.error,
            user_id: session.user.id,
            team_id: teamId,
            template_id: templateId,
            context: {
              status,
            },
          },
          `failed to patch /templates/{templateID}: ${res.error?.message || 'Unknown error'}`
        )

        if (status === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        throw apiError(status)
      }

      return { success: true, public: isPublic }
    }),
})

async function getDefaultTemplatesCached() {
  'use cache: remote'
  cacheTag(CACHE_TAGS.DEFAULT_TEMPLATES)
  cacheLife('hours')

  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      templates: MOCK_DEFAULT_TEMPLATES_DATA,
    }
  }

  // Default templates feature requires Supabase database
  // Return empty array when Supabase is not configured
  return {
    templates: [],
  }
}
