'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { assetSchema, type AssetInput } from '@/lib/validations/asset.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Client } from '@/types/database.types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const ASSET_TYPES = [
  'Aire acondicionado',
  'Tablero eléctrico',
  'Bomba de agua',
  'Motor eléctrico',
  'Generador',
  'UPS',
  'Transformador',
  'Planta eléctrica',
  'Sistema de iluminación',
  'Subestación eléctrica',
  'Otro',
]

export default function NuevoActivoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssetInput>({ resolver: zodResolver(assetSchema) })

  useEffect(() => {
    supabase.from('clients').select('id, company_name').then(({ data }) => {
      if (data) setClients(data as Client[])
    })
  }, [])

  async function onSubmit(data: AssetInput) {
    setError(null)
    // Generate unique QR code = random UUID-based slug
    const qrCode = `ASSET-${crypto.randomUUID().split('-')[0].toUpperCase()}`

    const { error } = await supabase.from('assets').insert({
      ...data,
      qr_code: qrCode,
    })

    if (error) {
      setError(error.message)
      return
    }
    router.push('/admin/activos')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/activos">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" /> Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Activo</h1>
          <p className="text-muted-foreground">Registra un equipo y genera su código QR</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => setValue('client_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Nombre del equipo</Label>
                <Input placeholder="Aire acondicionado sala de servidores" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Tipo de equipo</Label>
                <Select onValueChange={(v) => setValue('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Marca</Label>
                <Input placeholder="Carrier, LG, Siemens..." {...register('brand')} />
              </div>
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Input placeholder="Modelo del equipo" {...register('model')} />
              </div>
              <div className="space-y-1">
                <Label>Número de serie</Label>
                <Input placeholder="S/N o código interno" {...register('serial_number')} />
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Input placeholder="Piso 3, Sala de servidores" {...register('location')} />
              </div>
              <div className="space-y-1">
                <Label>Fecha de instalación</Label>
                <Input type="date" {...register('installation_date')} />
              </div>
              <div className="space-y-1">
                <Label>Estado inicial</Label>
                <Select onValueChange={(v) => setValue('status', v as AssetInput['status'])} defaultValue="activo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="en_mantenimiento">En mantenimiento</SelectItem>
                    <SelectItem value="fuera_de_servicio">Fuera de servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/admin/activos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar y generar QR'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
