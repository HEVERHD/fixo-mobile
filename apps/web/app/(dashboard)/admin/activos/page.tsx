import { Building2, MapPin, Package, Plus, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ASSET_STATUS_META, type AssetStatus } from '@/lib/assets'
import { CardLink, Chip, EmptyState, MetaRow, PageHeader, PrimaryLink } from '@/components/app/ui'
import { PrintLabelsButton } from '@/components/assets/PrintLabelsButton'

interface AssetRow {
  id: string
  name: string
  type: string | null
  brand: string | null
  model: string | null
  status: AssetStatus
  location: string | null
  qr_code: string
  clients: { company_name: string } | null
}

export default async function ActivosPage() {
  const supabase = await createClient()

  const [{ data }, { data: org }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, name, type, brand, model, status, location, qr_code, clients(company_name)')
      .order('created_at', { ascending: false }),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  const assets = (data ?? []) as unknown as AssetRow[]

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Equipos"
        subtitle={assets.length === 1 ? '1 equipo registrado' : `${assets.length} equipos registrados`}
        actions={
          <>
            {assets.length > 0 && (
              <PrintLabelsButton
                label="Imprimir todas"
                orgName={org?.name ?? ''}
                assets={assets.map((a) => ({ name: a.name, qr_code: a.qr_code, location: a.location, clientName: a.clients?.company_name }))}
              />
            )}
            <PrimaryLink href="/admin/activos/nuevo" icon={Plus}>Nuevo equipo</PrimaryLink>
          </>
        }
      />

      {assets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay equipos registrados"
          message="Los equipos que registres aparecerán aquí con su código QR."
          action={<PrimaryLink href="/admin/activos/nuevo" icon={Plus}>Registrar equipo</PrimaryLink>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => {
            const status = ASSET_STATUS_META[asset.status] ?? ASSET_STATUS_META.activo
            const detail = [asset.type, [asset.brand, asset.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
            return (
              <CardLink key={asset.id} href={`/admin/activos/${asset.id}`}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{asset.name}</p>
                  <Chip className={status.chip}>{status.label}</Chip>
                </div>
                {detail && <p className="text-sm text-gray-500">{detail}</p>}
                {asset.clients && <MetaRow icon={Building2}>{asset.clients.company_name}</MetaRow>}
                {asset.location && <MetaRow icon={MapPin}>{asset.location}</MetaRow>}
                <MetaRow icon={QrCode} className="font-mono">{asset.qr_code}</MetaRow>
              </CardLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
