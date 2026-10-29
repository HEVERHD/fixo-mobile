import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/ui'
import { QuoteForm, type ApuItem } from '@/components/financial/QuoteForm'

export default async function NuevaCotizacionPage() {
  const supabase = await createClient()
  const [{ data: c }, { data: apu }] = await Promise.all([
    supabase.from('clients').select('id, company_name').order('company_name'),
    // Each company has its own catalog (RLS); a new company starts empty
    supabase.from('apu_catalog').select('id, category, code, description, unit, unit_price').order('category').order('code'),
  ])

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref="/admin/financiero" title="Nueva cotización" subtitle="Arma la cotización por ítems; los totales se calculan solos." />
      <QuoteForm
        clients={(c ?? []).map((x) => ({ id: x.id, label: x.company_name }))}
        catalog={(apu ?? []) as ApuItem[]}
      />
    </div>
  )
}
