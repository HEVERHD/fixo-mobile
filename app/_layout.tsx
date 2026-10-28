import '../global.css'
import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { supabase, type Role } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole((data?.role as Role) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    if (loading) return
    if (!session) {
      router.replace('/(auth)/login')
    } else if (role) {
      router.replace(`/(${role})` as any)
    }
  }, [session, role, loading])

  return (
    <KeyboardProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </KeyboardProvider>
  )
}
