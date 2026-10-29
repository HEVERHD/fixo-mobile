import { PageHeader } from '@/components/app/ui'
import { NewClientForm } from '@/components/clients/NewClientForm'

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader backHref="/admin/clientes" title="Nuevo cliente" subtitle="A quién le prestas el servicio." />
      <NewClientForm />
    </div>
  )
}
