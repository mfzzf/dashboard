import 'server-only'

import { cache } from 'react'

/**
 * Returns a mock user since we're using environment-based authentication.
 * The actual user ID comes from the E2B_ACCESS_TOKEN JWT.
 *
 * @param accessToken - The user's access token (not used in env-based auth)
 * @returns A promise that resolves to an object containing mock user data
 */
function getUserByToken(accessToken: string | undefined) {
  // Return mock user for env-based authentication
  const userId = process.env.USER_ID || '00000000-0000-0000-0000-000000000000'
  
  return Promise.resolve({
    data: {
      user: {
        id: userId,
        email: 'admin@local',
        app_metadata: {},
        user_metadata: { name: 'Admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    },
    error: null,
  })
}

export default cache(getUserByToken)
