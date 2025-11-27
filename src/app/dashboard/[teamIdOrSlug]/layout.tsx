import { COOKIE_KEYS } from '@/configs/cookies'
import { METADATA } from '@/configs/metadata'
import { DashboardContextProvider } from '@/features/dashboard/context'
import DashboardLayoutView from '@/features/dashboard/layout/layout'
import Sidebar from '@/features/dashboard/sidebar/sidebar'
import { l } from '@/lib/clients/logger/logger'
import { getTeamFromInfra } from '@/server/team/get-team-from-infra'
import { SidebarInset, SidebarProvider } from '@/ui/primitives/sidebar'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Metadata } from 'next/types'
import { serializeError } from 'serialize-error'

export const metadata: Metadata = {
  title: 'Dashboard - E2B',
  description: METADATA.description,
  openGraph: METADATA.openGraph,
  twitter: METADATA.twitter,
  robots: 'noindex, nofollow',
}

export interface DashboardLayoutProps {
  params: Promise<{
    teamIdOrSlug: string
  }>
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const cookieStore = await cookies()
  const { teamIdOrSlug } = await params

  const sidebarState = cookieStore.get(COOKIE_KEYS.SIDEBAR_STATE)?.value
  const defaultOpen = sidebarState === 'true'

  const teamRes = await getTeamFromInfra(teamIdOrSlug)

  if (!teamRes) {
    l.warn(
      {
        key: 'dashboard_layout:team_not_resolved',
        error: serializeError(teamRes),
        context: {
          teamIdOrSlug,
        },
      },
      `dashboard_layout:team_not_resolved - team not resolved when accessing team (${teamIdOrSlug}) in dashboard layout`
    )
    notFound()
  }

  return (
    <DashboardContextProvider initialTeam={teamRes}>
      <SidebarProvider
        defaultOpen={typeof sidebarState === 'undefined' ? true : defaultOpen}
      >
        <div className="fixed inset-0 flex max-h-full min-h-0 w-full flex-col overflow-hidden">
          <div className="flex h-full max-h-full min-h-0 w-full flex-1 overflow-hidden">
            <Sidebar />
            <SidebarInset>
              <DashboardLayoutView params={params}>
                {children}
              </DashboardLayoutView>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </DashboardContextProvider>
  )
}
