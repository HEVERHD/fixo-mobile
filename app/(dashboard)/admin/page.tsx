import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Package, Users, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalAssets },
    { count: totalClients },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('work_orders').select('*', { count: 'exact', head: true }),
    supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    supabase.from('assets').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase
      .from('work_orders')
      .select('id, order_number, description, status, priority, scheduled_date, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const statusColor: Record<string, string> = {
    pendiente: 'text-yellow-600 bg-yellow-50',
    en_proceso: 'text-blue-600 bg-blue-50',
    completada: 'text-green-600 bg-green-50',
    cancelada: 'text-red-600 bg-red-50',
  }

  const priorityColor: Record<string, string> = {
    baja: 'bg-gray-100 text-gray-600',
    media: 'bg-blue-100 text-blue-700',
    alta: 'bg-orange-100 text-orange-700',
    urgente: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de operaciones</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Órdenes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activos Registrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAssets ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClients ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{order.order_number}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[order.priority]}`}>
                        {order.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{order.description}</p>
                    {order.clients && (
                      <p className="text-xs text-muted-foreground">
                        {(order.clients as { company_name: string }).company_name}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor[order.status]}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="mb-2 h-8 w-8" />
              <p className="text-sm">No hay órdenes recientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
