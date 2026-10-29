import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app/ui'
import { ApuCatalogEditor, type ApuRow } from '@/components/financial/ApuCatalogEditor'

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apu_catalog')
    .select('id, category, code, description, unit, unit_price, type')
    .order('category')
    .order('code')

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-10">
      <PageHeader
        backHref="/admin/financiero"
        title="Catálogo APU"
        subtitle="Tus precios de materiales y mano de obra para armar cotizaciones más rápido."
      />
      <ApuCatalogEditor items={(data ?? []) as ApuRow[]} />
    </div>
  )
}
