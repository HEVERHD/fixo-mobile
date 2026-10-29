'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { workOrderSchema, type WorkOrderInput } from '@/lib/validations/order.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Client, Operator, Asset } from '@/types/database.types'

export default function NuevaOrdenPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [operators, setOperators] = useState<Array<Operator & { profiles?: { full_name: string } }>>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderInput>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { type: 'correctivo', priority: 'media' },
  })

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id, company_name'),
      supabase.from('operators').select('id, user_id, profiles(full_name)'),
    ]).then(([{ data: c }, { data: o }]) => {
      if (c) setClients(c as Client[])
      if (o) setOperators(o as Array<Operator & { profiles?: { full_name: string } }>)
    })
  }, [])

  useEffect(() => {
    if (!selectedClient) return
    supabase
      .from('assets')
      .select('id, name, type')
      .eq('client_id', selectedClient)
      .then(({ data }) => { if (data) setAssets(data as Asset[]) })
  }, [selectedClient])

  async function onSubmit(data: WorkOrderInput) {
    setError(null)
    const payload = {
      ...data,
      order_number: '',
      asset_id: data.asset_id || null,
      assigned_operator_id: data.assigned_operator_id || null,
    }
    const { error } = await supabase.from('work_orders').insert(payload)
    if (error) { setError(error.message); return }
    router.push('/admin/ordenes')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/ordenes">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden de Trabajo</h1>
          <p className="text-muted-foreground">Crea y asigna una nueva orden de servicio</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos de la orden</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Client */}
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Select onValueChange={(v) => { setValue('client_id', v); setSelectedClient(v) }}>
                <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-destructive">{errors.client_id.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Asset */}
              <div className="space-y-1">
                <Label>Equipo (opcional)</Label>
                <Select onValueChange={(v) => setValue('asset_id', v)}>
                  <SelectTrigger><SelectValue placeholder={assets.length ? 'Selecciona equipo' : 'Primero selecciona cliente'} /></SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator */}
              <div className="space-y-1">
                <Label>Operario asignado</Label>
                <Select onValueChange={(v) => setValue('assigned_operator_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    {operators.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {(o.profiles as { full_name: string } | undefined)?.full_name ?? o.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label>Tipo de servicio *</Label>
                <Select onValueChange={(v) => setValue('type', v as WorkOrderInput['type'])} defaultValue="correctivo">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                    <SelectItem value="instalacion">Instalación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <Label>Prioridad *</Label>
                <Select onValueChange={(v) => setValue('priority', v as WorkOrderInput['priority'])} defaultValue="media">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1 sm:col-span-2">
                <Label>Fecha programada</Label>
                <Input type="date" {...register('scheduled_date')} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Descripción *</Label>
              <Textarea
                placeholder="Describe el servicio a realizar..."
                rows={3}
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notas internas</Label>
              <Textarea placeholder="Observaciones adicionales..." rows={2} {...register('notes')} />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/admin/ordenes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
