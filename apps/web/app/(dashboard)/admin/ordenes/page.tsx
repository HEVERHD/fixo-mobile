import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function OrdenesPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('work_orders')
    .select('*, clients(company_name), operators(profiles(full_name)), assets(name)')
    .order('created_at', { ascending: false })

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pendiente: 'outline',
    en_proceso: 'default',
    completada: 'secondary',
    cancelada: 'destructive',
  }

  const priorityColor: Record<string, string> = {
    baja: 'bg-gray-100 text-gray-600',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestión y seguimiento de servicios</p>
        </div>
        <Link href="/admin/ordenes/nueva">
          <Button>
            <Plus size={16} className="mr-2" /> Nueva Orden
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{orders?.length ?? 0} órdenes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Operario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                    <TableCell>{(o.clients as { company_name: string } | null)?.company_name ?? '—'}</TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate text-sm">{o.description}</p>
                    </TableCell>
                    <TableCell className="capitalize">{o.type}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[o.priority]}`}>
                        {o.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {(o.operators as { profiles?: { full_name?: string } } | null)?.profiles?.full_name ?? 'Sin asignar'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.scheduled_date
                        ? format(new Date(o.scheduled_date), 'd MMM', { locale: es })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[o.status]}>
                        {o.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/ordenes/${o.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye size={14} className="mr-1" /> Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No hay órdenes. Crea la primera.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
