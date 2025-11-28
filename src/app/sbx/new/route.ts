import { BEARER_AUTH_HEADERS, SDK_AUTH_HEADERS } from '@/configs/api'
import { PROTECTED_URLS } from '@/configs/urls'
import { infra } from '@/lib/clients/api'
import { l } from '@/lib/clients/logger/logger'
import Sandbox from 'e2b'
import { NextRequest, NextResponse } from 'next/server'
import { serializeError } from 'serialize-error'

export const GET = async (req: NextRequest) => {
  try {
    // Get default team from infra API
    const teamsRes = await infra.GET('/teams', {
      headers: BEARER_AUTH_HEADERS(),
    })

    if (teamsRes.error || !teamsRes.data || teamsRes.data.length === 0) {
      l.warn(
        {
          key: 'sbx_new:no_teams',
        },
        `sbx_new: no teams available`
      )
      return NextResponse.redirect(new URL(req.url).origin)
    }

    const defaultTeam =
      teamsRes.data.find((t: { isDefault?: boolean }) => t.isDefault) ||
      teamsRes.data[0]

    const sbx = await Sandbox.create('base', {
      domain: process.env.NEXT_PUBLIC_E2B_DOMAIN,
      headers: SDK_AUTH_HEADERS(),
    })

    const inspectUrl = PROTECTED_URLS.SANDBOX_INSPECT(
      defaultTeam.name,
      sbx.sandboxId
    )

    return NextResponse.redirect(new URL(inspectUrl, req.url))
  } catch (error) {
    l.warn(
      {
        key: 'sbx_new:unexpected_error',
        error: serializeError(error),
      },
      `sbx_new: unexpected error`
    )

    return NextResponse.redirect(new URL(req.url).origin)
  }
}
