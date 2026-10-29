import { CalendarCheck, MapPin, Package, QrCode } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { clientContext } from '@/lib/auth'
import { ASSET_STATUS_META, type AssetStatus } from '@/lib/assets'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader } from '@/components/app/ui'

interface AssetRow {
  id: string
  name: string
  type: string | null
  brand: string | null
  model: string | null
  status: AssetStatus
  location: string | null
  installation_date: string | null
  qr_code: string
}

export default async function ClienteActivosPage() {
  const ctx = await clientContext()
  if (!ctx) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
        <EmptyState icon={Package} title="Tu cuenta aún no está vinculada a un cliente" message="Contacta al administrador de tu proveedor." />
      </div>
    )
  }

  const { data } = await ctx.supabase
    .from('assets')
    .select('id, name, type, brand, model, status, location, installation_date, qr_code')
    .eq('client_id', ctx.client.id)
    .order('created_at', { ascending: false })
  const assets = (data ?? []) as AssetRow[]

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader title="Mis equipos" subtitle={assets.length === 1 ? '1 equipo' : `${assets.length} equipos`} />
      {assets.length === 0 ? (
        <EmptyState icon={Package} title="No tienes equipos registrados" message="Tus equipos aparecerán aquí una vez tu proveedor los registre." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => {
            const status = ASSET_STATUS_META[asset.status] ?? ASSET_STATUS_META.activo
            const detail = [asset.type, [asset.brand, asset.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
            return (
              <CardLink key={asset.id} href={`/cliente/activos/${asset.id}`}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{asset.name}</p>
                  <Chip className={status.chip}>{status.label}</Chip>
                </div>
                {detail && <p className="text-sm text-gray-500">{detail}</p>}
                {asset.location && <MetaRow icon={MapPin}>{asset.location}</MetaRow>}
                {asset.installation_date && (
                  <MetaRow icon={CalendarCheck}>Instalado el {format(parseISO(asset.installation_date), "d 'de' MMMM yyyy", { locale: es })}</MetaRow>
                )}
                <MetaRow icon={QrCode} className="font-mono">{asset.qr_code}</MetaRow>
              </CardLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
