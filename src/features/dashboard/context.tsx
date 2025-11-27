'use client'

import { ClientTeam } from '@/types/dashboard.types'
import { createContext, ReactNode, useContext, useState } from 'react'

interface DashboardContextValue {
  team: ClientTeam
  setTeam: (team: ClientTeam) => void
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
)

interface DashboardContextProviderProps {
  children: ReactNode
  initialTeam: ClientTeam
}

export function DashboardContextProvider({
  children,
  initialTeam,
}: DashboardContextProviderProps) {
  const [team, setTeam] = useState(initialTeam)

  const value = {
    team,
    setTeam,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error(
      'useDashboardContext must be used within a DashboardContextProvider'
    )
  }
  return context
}
