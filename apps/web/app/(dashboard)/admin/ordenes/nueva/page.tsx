import { createClient } from '@/lib/supabase/server'
import { featuresFor, type BusinessType } from '@/lib/workOrders'
import { PageHeader } from '@/components/app/ui'
import { NewOrderForm, type Option } from '@/components/orders/NewOrderForm'

const asId = (v: string | string[] | undefined) =>
  typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : null

export default async function NuevaOrdenPage({ searchParams }: PageProps<'/admin/ordenes/nueva'>) {
  // Optional prefill, e.g. "Nueva orden para este equipo" from an asset sheet
  const { clientId, assetId } = await searchParams
  const supabase = await createClient()

  const [{ data: c }, { data: a }, { data: p }, { data: o }, { data: org }] = await Promise.all([
    supabase.from('clients').select('id, company_name').order('company_name'),
    supabase.from('assets').select('id, name, location, client_id').order('name'),
    supabase.from('projects').select('id, name, client_id').neq('status', 'terminada').order('name'),
    supabase.from('operators').select('id, specialty, profiles(full_name)'),
    supabase.from('organizations').select('business_type').maybeSingle(),
  ])

  const clients: Option[] = (c ?? []).map((x) => ({ id: x.id, label: x.company_name }))
  const assets: Option[] = (a ?? []).map((x) => ({ id: x.id, label: x.location ? `${x.name} · ${x.location}` : x.name, clientId: x.client_id }))
  const projects: Option[] = (p ?? []).map((x) => ({ id: x.id, label: x.name, clientId: x.client_id }))
  const operators: Option[] = ((o ?? []) as unknown as { id: string; specialty: string | null; profiles: { full_name: string } | null }[])
    .map((x) => ({ id: x.id, label: (x.profiles?.full_name ?? 'Técnico sin nombre') + (x.specialty ? ` · ${x.specialty}` : '') }))

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref="/admin/ordenes" title="Nueva orden de trabajo" subtitle="Registra un servicio y asígnalo a tu equipo." />
      <NewOrderForm
        clients={clients}
        assets={assets}
        projects={projects}
        operators={operators}
        showProjects={featuresFor(org?.business_type as BusinessType | undefined).obras}
        initialClientId={asId(clientId)}
        initialAssetId={asId(assetId)}
      />
    </div>
  )
}
