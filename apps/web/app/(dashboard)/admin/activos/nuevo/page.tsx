import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/ui'
import { NewAssetForm } from '@/components/assets/NewAssetForm'

export default async function NuevoActivoPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('id, company_name').order('company_name')
  const clients = (data ?? []).map((c) => ({ id: c.id, label: c.company_name }))

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref="/admin/activos" title="Nuevo equipo" subtitle="Regístralo y genera su etiqueta QR." />
      <NewAssetForm clients={clients} />
    </div>
  )
}
