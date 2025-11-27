import 'server-only'

import { authActionClient, withTeamIdResolution } from '@/lib/clients/action'
import { TeamIdOrSlugSchema } from '@/lib/schemas/team'
import { z } from 'zod'

const GetTeamMembersSchema = z.object({
  teamIdOrSlug: TeamIdOrSlugSchema,
})

export const getTeamMembers = authActionClient
  .schema(GetTeamMembersSchema)
  .metadata({ serverFunctionName: 'getTeamMembers' })
  .use(withTeamIdResolution)
  .action(async ({ ctx }) => {
    // Return empty array since we're not using Supabase for user management
    // Team members functionality is disabled without Supabase auth
    return []
  })
