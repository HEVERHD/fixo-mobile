import '../global.css'
import { useEffect, useState } from 'react'
import { Stack, router, useSegments, type Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { supabase, type Role } from '@/lib/supabase'
import { AuthLinkHandler } from '@/components/AuthLinkHandler'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [superAdmin, setSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const segments = useSegments()
  const inAuthGroup = segments[0] === '(auth)'
  const onNoAccess = segments[0] === 'sin-acceso'

  useEffect(() => {
    async function fetchRole(userId: string) {
      const [{ data }, { data: isSuper }] = await Promise.all([
        supabase.from('profiles').select('role, organization_id').eq('id', userId).single(),
        supabase.rpc('is_super_admin'),
      ])
      let nextRole = data?.organization_id ? ((data.role as Role) ?? null) : null
      // No company yet: accept a pending invitation for this (confirmed) email, if any
      if (data && !data.organization_id) {
        const { data: claimed } = await supabase.rpc('claim_my_invitation')
        if (claimed) nextRole = claimed as Role
      }
      // A role only counts once the user belongs to an organization
      setRole(nextRole)
      setSuperAdmin(isSuper === true)
      setLoading(false)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // Hold routing until the role is known, so "sin acceso" doesn't flash on sign-in
        setLoading(true)
        fetchRole(session.user.id)
      } else {
        setRole(null)
        setSuperAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    if (!session) {
      // Stay on sign-up screens opened from a link (e.g. fixo://unirme?email=…)
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (superAdmin) {
      // Platform owners land on the platform panel; they can jump to their own company from there
      router.replace('/(superadmin)' as Href)
    } else if (role) {
      router.replace(`/(${role})` as Href)
    } else if (!onNoAccess) {
      router.replace('/sin-acceso' as Href)
    }
  }, [session, role, superAdmin, loading, inAuthGroup, onNoAccess])

  return (
    <KeyboardProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="nueva-orden" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nueva-obra" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nuevo-cliente" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nuevo-equipo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invitar" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Email-confirmation deep links: auto sign-in + welcome modal */}
      <AuthLinkHandler />
    </KeyboardProvider>
  )
}
