'use server'

import { SUPABASE_AUTH_HEADERS } from '@/configs/api'
import { authActionClient, withTeamIdResolution } from '@/lib/clients/action'
import { TeamIdOrSlugSchema } from '@/lib/schemas/team'
import { handleDefaultInfraError, returnServerError } from '@/lib/utils/action'
import { CreateTeamSchema, UpdateTeamNameSchema } from '@/server/team/types'
import { CreateTeamsResponse } from '@/types/billing.types'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

export const updateTeamNameAction = authActionClient
  .schema(UpdateTeamNameSchema)
  .metadata({ actionName: 'updateTeamName' })

  .use(withTeamIdResolution)
  .action(async ({ parsedInput, ctx }) => {
    const { name, teamIdOrSlug } = parsedInput
    const { teamId } = ctx

    // Database is read-only, so we can't update team name
    return returnServerError('Team name updates are not supported in read-only mode')
  })

const AddTeamMemberSchema = z.object({
  teamIdOrSlug: TeamIdOrSlugSchema,
  email: z.email(),
})

export const addTeamMemberAction = authActionClient
  .schema(AddTeamMemberSchema)
  .metadata({ actionName: 'addTeamMember' })
  .use(withTeamIdResolution)
  .action(async ({ parsedInput, ctx }) => {
    // Database is read-only, so we can't add team members
    return returnServerError('Adding team members is not supported in read-only mode')
  })

const RemoveTeamMemberSchema = z.object({
  teamIdOrSlug: TeamIdOrSlugSchema,
  userId: z.uuid(),
})

export const removeTeamMemberAction = authActionClient
  .schema(RemoveTeamMemberSchema)
  .metadata({ actionName: 'removeTeamMember' })
  .use(withTeamIdResolution)
  .action(async ({ parsedInput, ctx }) => {
    // Database is read-only, so we can't remove team members
    return returnServerError('Removing team members is not supported in read-only mode')
  })

export const createTeamAction = authActionClient
  .schema(CreateTeamSchema)
  .metadata({ actionName: 'createTeam' })
  .action(async ({ parsedInput, ctx }) => {
    const { name } = parsedInput
    const { session } = ctx

    const response = await fetch(`${process.env.BILLING_API_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...SUPABASE_AUTH_HEADERS(session.access_token),
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const status = response.status
      const error = await response.json()

      if (status === 400) {
        return returnServerError(error?.message ?? 'Failed to create team')
      }

      return handleDefaultInfraError(status)
    }

    const data = (await response.json()) as CreateTeamsResponse

    return data
  })

const UploadTeamProfilePictureSchema = zfd.formData(
  z.object({
    teamIdOrSlug: zfd.text(),
    image: zfd.file(),
  })
)

export const uploadTeamProfilePictureAction = authActionClient
  .schema(UploadTeamProfilePictureSchema)
  .metadata({ actionName: 'uploadTeamProfilePicture' })
  .use(withTeamIdResolution)
  .action(async ({ parsedInput, ctx }) => {
    // Database is read-only, so we can't upload profile pictures
    return returnServerError('Uploading profile pictures is not supported in read-only mode')
  })
