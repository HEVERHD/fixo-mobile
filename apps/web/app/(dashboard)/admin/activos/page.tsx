import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, QrCode, Eye } from 'lucide-react'
import Link from 'next/link'

export default async function ActivosPage() {
  const supabase = await createClient()

  const { data: assets } = await supabase
    .from('assets')
    .select('*, clients(company_name)')
    .order('created_at', { ascending: false })

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    activo: 'default',
    en_mantenimiento: 'secondary',
    fuera_de_servicio: 'destructive',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activos / Equipos</h1>
          <p className="text-muted-foreground">Gestión de equipos e identificación por QR</p>
        </div>
        <Link href="/admin/activos/nuevo">
          <Button>
            <Plus size={16} className="mr-2" /> Nuevo Activo
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {assets?.length ?? 0} activos registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets && assets.length > 0 ? (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(asset.clients as { company_name: string } | null)?.company_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{asset.location ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[asset.status]}>
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/qr/${asset.id}`} target="_blank">
                          <Button size="sm" variant="outline">
                            <QrCode size={14} className="mr-1" /> QR
                          </Button>
                        </Link>
                        <Link href={`/admin/activos/${asset.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1" /> Ver
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay activos registrados. Crea el primero.
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
