import { PageHeader } from '@/components/app/ui'
import { QrScanner } from '@/components/assets/QrScanner'

export default function EscanearPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-10">
      <PageHeader title="Escanear equipo" subtitle="Apunta la cámara a la etiqueta QR del equipo para abrir su ficha." />
      <QrScanner />
    </div>
  )
}
