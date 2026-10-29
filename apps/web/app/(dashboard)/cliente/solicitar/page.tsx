import { Package } from 'lucide-react'
import { clientContext } from '@/lib/auth'
import { EmptyState, PageHeader } from '@/components/app/ui'
import { ServiceRequestForm } from '@/components/requests/ServiceRequestForm'

export default async function SolicitarPage({ searchParams }: PageProps<'/cliente/solicitar'>) {
  const { assetId } = await searchParams
  const ctx = await clientContext()
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
        <EmptyState icon={Package} title="Tu cuenta aún no está vinculada a un cliente" message="Contacta al administrador de tu proveedor." />
      </div>
    )
  }

  const { data } = await ctx.supabase.from('assets').select('id, name, location').eq('client_id', ctx.client.id).order('name')
  const assets = (data ?? []).map((a) => ({ id: a.id, label: a.location ? `${a.name} · ${a.location}` : a.name }))
  const initialAssetId = assets.some((a) => a.id === assetId) ? (assetId as string) : null

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref="/cliente" title="Solicitar servicio" subtitle="Cuéntanos qué pasa y tu proveedor lo programará." />
      <ServiceRequestForm assets={assets} initialAssetId={initialAssetId} />
    </div>
  )
}
