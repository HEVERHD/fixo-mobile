import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Role } from '@/types/database.types'

// All dashboard pages are authenticated and dynamic (no prerendering)
export const instant = false

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:h-screen lg:flex-row lg:overflow-hidden">
      <Sidebar role={profile.role as Role} fullName={profile.full_name} />
      <main className="flex-1 pb-20 lg:overflow-y-auto lg:pb-0">
        {children}
      </main>
    </div>
  )
}
