// Target of printed QR stickers: <base>/q/<qr_code> (see lib/assets.ts). Always reads live data.
export const instant = false

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAssetCode } from '@/lib/assets'

/** Resolves a sticker code to the asset sheet. Signed-out visitors are sent to /login by proxy.ts. */
export default async function QrCodePage({ params }: PageProps<'/q/[code]'>) {
  const { code } = await params
  const normalized = decodeURIComponent(code).toUpperCase()
  if (!isAssetCode(normalized)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS returns nothing for assets of another company
  const [{ data: asset }, { data: profile }] = await Promise.all([
    supabase.from('assets').select('id').eq('qr_code', normalized).maybeSingle(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])
  if (!asset) notFound()

  const sheet: Record<string, string> = {
    admin: `/admin/activos/${asset.id}`,
    operario: `/operario/activos/${asset.id}`,
    cliente: `/cliente/activos/${asset.id}`,
  }
  redirect(sheet[profile?.role ?? ''] ?? `/qr/${asset.id}`)
}
