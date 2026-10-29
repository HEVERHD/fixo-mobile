import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMyOrganization, featuresFor, type Organization } from '@/lib/organization'

interface OrganizationState {
  org: Organization | null
  loaded: boolean
  features: ReturnType<typeof featuresFor>
  /** Re-read the organization after changing it (logo, business type…). */
  refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationState | null>(null)

/**
 * Loads the signed-in user's organization once for an area (e.g. the admin tabs)
 * so tabs, dashboard and settings agree on its business type without refetching.
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setOrg(await fetchMyOrganization())
    setLoaded(true)
  }, [])

  useEffect(() => {
    fetchMyOrganization().then(o => { setOrg(o); setLoaded(true) })
  }, [])

  const value = useMemo(
    () => ({ org, loaded, features: featuresFor(org?.business_type), refresh }),
    [org, loaded, refresh],
  )
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error('useOrganization must be used inside OrganizationProvider')
  return ctx
}
