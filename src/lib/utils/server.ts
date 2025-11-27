import 'server-only'

import { COOKIE_KEYS } from '@/configs/cookies'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { z } from 'zod'

export const getTeamMetadataFromCookies = async (teamIdOrSlug: string) => {
  const cookiesStore = await cookies()

  const cookieTeamId = cookiesStore.get(COOKIE_KEYS.SELECTED_TEAM_ID)?.value
  const cookieTeamSlug = cookiesStore.get(COOKIE_KEYS.SELECTED_TEAM_SLUG)?.value

  if (!cookieTeamId || !cookieTeamSlug) {
    return null
  }

  const isSensical =
    cookieTeamId === teamIdOrSlug || cookieTeamSlug === teamIdOrSlug
  const isUUID = z.uuid().safeParse(cookieTeamId).success

  if (isUUID && isSensical) {
    return {
      id: cookieTeamId,
      slug: cookieTeamSlug,
    }
  }

  return null
}

/**
 * Returns a consistent "now" timestamp for the entire request.
 * Memoized using React cache() to ensure all server components
 * in the same request tree get the exact same timestamp.
 *
 * The timestamp is rounded to the nearest 5 seconds for better cache alignment
 * and to reduce cache fragmentation.
 */
export const getNowMemo = cache(() => {
  const now = Date.now()
  // round to nearest 5 seconds for better cache alignment
  return Math.floor(now / 5000) * 5000
})
