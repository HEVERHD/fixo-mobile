import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QRDisplay } from '@/components/assets/QRDisplay'
import { ArrowLeft, Calendar, MapPin, Tag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*, clients(company_name, nit, contact_email)')
    .eq('id', id)
    .single()

  if (!asset) notFound()

  const { data: records } = await supabase
    .from('maintenance_records')
    .select('*, operators(profiles(full_name))')
    .eq('asset_id', id)
    .order('date', { ascending: false })
    .limit(10)

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    activo: 'default',
    en_mantenimiento: 'secondary',
    fuera_de_servicio: 'destructive',
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/activos">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" /> Volver
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <Badge variant={statusVariant[asset.status]}>
              {asset.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {(asset.clients as { company_name: string } | null)?.company_name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Asset Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ficha Técnica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Tipo', value: asset.type },
                { label: 'Marca', value: asset.brand },
                { label: 'Modelo', value: asset.model },
                { label: 'N° de Serie', value: asset.serial_number },
                { label: 'Código QR', value: asset.qr_code },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value ?? '—'}</p>
                </div>
              ))}
              {asset.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="text-sm font-medium">{asset.location}</p>
                  </div>
                </div>
              )}
              {asset.installation_date && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Instalación</p>
                    <p className="text-sm font-medium">
                      {format(new Date(asset.installation_date), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historial de Mantenimiento ({records?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {records && records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((rec) => (
                    <div key={rec.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {format(new Date(rec.date), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </p>
                        {rec.operators && (
                          <p className="text-xs text-muted-foreground">
                            {((rec.operators as { profiles?: { full_name?: string } }).profiles)?.full_name ?? 'Operario'}
                          </p>
                        )}
                      </div>
                      <p className="text-sm">{rec.tasks_performed}</p>
                      {rec.observations && (
                        <p className="text-xs text-muted-foreground">{rec.observations}</p>
                      )}
                      {rec.pending_tasks && (
                        <div className="rounded-md bg-yellow-50 p-2">
                          <p className="text-xs font-medium text-yellow-800">Pendiente:</p>
                          <p className="text-xs text-yellow-700">{rec.pending_tasks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros de mantenimiento.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QR Code Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Código QR</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRDisplay assetId={asset.id} assetName={asset.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
