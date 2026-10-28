import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function ClienteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Tu cuenta aún no está vinculada a un perfil de cliente. Contacta al administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [
    { data: assets },
    { data: orders },
    { data: quotes },
  ] = await Promise.all([
    supabase.from('assets').select('id, name, type, status').eq('client_id', client.id).limit(5),
    supabase
      .from('work_orders')
      .select('id, order_number, description, status, scheduled_date')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('quotes')
      .select('id, quote_number, total, status, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const statusColor: Record<string, string> = {
    pendiente: 'bg-yellow-50 text-yellow-700',
    en_proceso: 'bg-blue-50 text-blue-700',
    completada: 'bg-green-50 text-green-700',
    cancelada: 'bg-red-50 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground">{client.company_name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Mis Activos</CardTitle>
            <Link href="/cliente/activos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {assets && assets.length > 0 ? (
              assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.type}</p>
                    </div>
                  </div>
                  <Badge variant={a.status === 'activo' ? 'outline' : 'secondary'}>
                    {a.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay activos registrados.</p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Órdenes de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders && orders.length > 0 ? (
              orders.map((o) => (
                <div key={o.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{o.description}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status]}`}>
                    {o.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-4 text-muted-foreground">
                <CheckCircle2 size={24} className="mb-1" />
                <p className="text-sm">Sin órdenes activas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Cotizaciones</CardTitle>
            <Link href="/cliente/cotizaciones" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotes && quotes.length > 0 ? (
              quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{q.quote_number}</p>
                    <p className="text-sm text-muted-foreground">
                      ${Number(q.total).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      q.status === 'aprobada'
                        ? 'default'
                        : q.status === 'rechazada'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {q.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay cotizaciones.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
