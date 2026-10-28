// Dynamic page — reads from DB on each request (QR scan must show live data)
export const instant = false

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Zap, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function QRScanPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params
  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*, clients(company_name, contact_email, contact_phone)')
    .eq('id', assetId)
    .single()

  if (!asset) notFound()

  const { data: records } = await supabase
    .from('maintenance_records')
    .select('*, operators(profiles(full_name))')
    .eq('asset_id', assetId)
    .order('date', { ascending: false })
    .limit(5)

  const lastRecord = records?.[0]

  const statusColor: Record<string, string> = {
    activo: 'bg-green-100 text-green-800',
    en_mantenimiento: 'bg-yellow-100 text-yellow-800',
    fuera_de_servicio: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Fixo</p>
            <p className="text-xs text-muted-foreground">Ficha Técnica de Equipo</p>
          </div>
        </div>

        {/* Asset Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{asset.name}</CardTitle>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[asset.status]}`}>
                {asset.status.replace('_', ' ')}
              </span>
            </div>
            {asset.clients && (
              <p className="text-sm text-muted-foreground">
                {(asset.clients as { company_name: string }).company_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{asset.type}</p>
              </div>
              {asset.brand && (
                <div>
                  <p className="text-xs text-muted-foreground">Marca</p>
                  <p className="font-medium">{asset.brand}</p>
                </div>
              )}
              {asset.model && (
                <div>
                  <p className="text-xs text-muted-foreground">Modelo</p>
                  <p className="font-medium">{asset.model}</p>
                </div>
              )}
              {asset.serial_number && (
                <div>
                  <p className="text-xs text-muted-foreground">N° de Serie</p>
                  <p className="font-medium">{asset.serial_number}</p>
                </div>
              )}
            </div>

            {asset.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-muted-foreground" />
                <span>{asset.location}</span>
              </div>
            )}
            {asset.installation_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                <span>
                  Instalado: {format(new Date(asset.installation_date), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Maintenance */}
        {lastRecord && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} />
                Último Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {format(new Date(lastRecord.date), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                {lastRecord.operators && (
                  <p className="text-xs text-muted-foreground">
                    {((lastRecord.operators as { profiles?: { full_name?: string } }).profiles)?.full_name}
                  </p>
                )}
              </div>
              <p className="text-sm">{lastRecord.tasks_performed}</p>
              {lastRecord.pending_tasks && (
                <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3">
                  <AlertCircle size={14} className="mt-0.5 text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-800">Tareas pendientes:</p>
                    <p className="text-xs text-yellow-700">{lastRecord.pending_tasks}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Maintenance History */}
        {records && records.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {records.slice(1).map((rec) => (
                  <div key={rec.id} className="border-l-2 border-muted pl-3">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rec.date), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="text-sm">{rec.tasks_performed}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Código: {asset.qr_code} · Fixo
        </p>
      </div>
    </div>
  )
}
