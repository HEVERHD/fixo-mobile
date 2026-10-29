'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { maintenanceRecordSchema, type MaintenanceRecordInput } from '@/lib/validations/order.schema'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Upload, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { WorkOrder } from '@/types/database.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function OperarioOrdenDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<WorkOrder & {
    clients?: { company_name: string }
    assets?: { id: string; name: string; location: string | null; type: string }
  } | null>(null)
  const [operator, setOperator] = useState<{ id: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRecordInput>({ resolver: zodResolver(maintenanceRecordSchema) })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: op } = await supabase.from('operators').select('id').eq('user_id', user.id).single()
      setOperator(op)

      const { data: ord } = await supabase
        .from('work_orders')
        .select('*, clients(company_name), assets(id, name, location, type)')
        .eq('id', params.id as string)
        .single()
      if (ord) setOrder(ord as typeof order)
    }
    load()
  }, [params.id])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const path = `maintenance/${params.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('field-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('field-photos').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }
    }
    setPhotos((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  async function onSubmit(data: MaintenanceRecordInput) {
    if (!operator || !order) return
    setError(null)

    // Create maintenance record
    const { error: recErr } = await supabase.from('maintenance_records').insert({
      work_order_id: order.id,
      asset_id: order.asset_id!,
      operator_id: operator.id,
      tasks_performed: data.tasks_performed,
      observations: data.observations || null,
      pending_tasks: data.pending_tasks || null,
      photos,
    })

    if (recErr) { setError(recErr.message); return }

    // Update order status to completada
    await supabase
      .from('work_orders')
      .update({ status: 'completada', completed_date: new Date().toISOString().split('T')[0] })
      .eq('id', order.id)

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold">Reporte enviado</h2>
        <p className="text-muted-foreground">La orden fue marcada como completada.</p>
        <Link href="/operario">
          <Button>Volver a Mis Órdenes</Button>
        </Link>
      </div>
    )
  }

  if (!order) {
    return <div className="p-6 text-muted-foreground">Cargando orden...</div>
  }

  const priorityColor: Record<string, string> = {
    baja: 'secondary', media: 'outline', alta: 'default', urgente: 'destructive',
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/operario">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Volver</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{order.clients?.company_name}</p>
        </div>
      </div>

      {/* Order Info */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={priorityColor[order.priority] as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {order.priority}
            </Badge>
            <Badge variant="outline" className="capitalize">{order.type}</Badge>
          </div>
          <p className="text-sm">{order.description}</p>
          {order.assets && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-medium">{order.assets.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{order.assets.type}</p>
              {order.assets.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={11} /> {order.assets.location}
                </div>
              )}
            </div>
          )}
          {order.scheduled_date && (
            <p className="text-xs text-muted-foreground">
              Programada: {format(new Date(order.scheduled_date), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Report Form */}
      {order.status !== 'completada' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Reporte de Servicio</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Tareas realizadas *</Label>
                <Textarea
                  placeholder="Describe detalladamente las tareas ejecutadas..."
                  rows={4}
                  {...register('tasks_performed')}
                />
                {errors.tasks_performed && (
                  <p className="text-sm text-destructive">{errors.tasks_performed.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Estado del equipo, anomalías encontradas..."
                  rows={2}
                  {...register('observations')}
                />
              </div>

              <div className="space-y-1">
                <Label>Tareas pendientes</Label>
                <Textarea
                  placeholder="Trabajos que quedaron pendientes para la próxima visita..."
                  rows={2}
                  {...register('pending_tasks')}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Fotos de evidencia</Label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-4 hover:bg-accent">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Subiendo...' : 'Toca para agregar fotos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt={`foto-${i}`} className="h-20 w-full rounded-md object-cover" />
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
                {isSubmitting ? 'Enviando...' : 'Completar Orden y Enviar Reporte'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {order.status === 'completada' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-medium">Orden completada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
