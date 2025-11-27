'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/primitives/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/primitives/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem } from '@/ui/primitives/sidebar'
import { ChevronsUpDown, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useDashboard } from '../context'
import DashboardSidebarMenuTeams from './menu-teams'

interface DashboardSidebarMenuProps {
  className?: string
}

export default function DashboardSidebarMenu({
  className,
}: DashboardSidebarMenuProps) {
  const { team } = useDashboard()

  return (
    <SidebarMenuItem className="px-3 pb-2 group-data-[collapsible=icon]:p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            variant="outline"
            size="lg"
            className={cn(
              'h-14 flex',
              'group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:!px-0',
              className
            )}
          >
            <Avatar
              className={cn(
                'shrink-0 transition-all duration-100 ease-in-out',
                'group-data-[collapsible=icon]:block group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-[5px]',
                {
                  'drop-shadow-sm filter': team.profile_picture_url,
                }
              )}
            >
              <AvatarImage
                src={team.profile_picture_url || undefined}
                className="group-data-[collapsible=icon]:size-full object-cover object-center"
              />
              <AvatarFallback className="bg-bg-hover border-0">
                {team.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left  leading-tight">
              <span className="text-fg-tertiary font-mono truncate prose-label">
                TEAM
              </span>
              <span className="text-fg truncate prose-body-highlight normal-case">
                {team.transformed_default_name || team.name}
              </span>
            </div>
            <ChevronsUpDown className="text-fg-tertiary ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          collisionPadding={10}
          className="w-[280px] px-3"
          align="start"
          sideOffset={4}
        >
          <DashboardSidebarMenuTeams />

          <DropdownMenuGroup className="gap-1 pt-2 pb-2">
            <DropdownMenuItem
              className="font-sans prose-label-highlight"
              asChild
            >
              <Link href="/">
                <Terminal className="size-4" /> 控制台
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
