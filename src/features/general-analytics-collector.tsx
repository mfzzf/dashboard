'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function GeneralAnalyticsCollector() {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    // No user authentication - identify as anonymous
    posthog?.identify('anonymous-user')
  }, [posthog])

  return null
}
