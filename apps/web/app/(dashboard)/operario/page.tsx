import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function OperarioDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: operator } = await supabase
    .from('operators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const { data: orders } = operator
    ? await supabase
        .from('work_orders')
        .select('*, clients(company_name), assets(name, location, type)')
        .eq('assigned_operator_id', operator.id)
        .in('status', ['pendiente', 'en_proceso'])
        .order('scheduled_date', { ascending: true })
        .limit(20)
    : { data: [] }

  const todayOrders = orders?.filter((o) => o.scheduled_date === today) ?? []
  const upcomingOrders = orders?.filter((o) => o.scheduled_date && o.scheduled_date > today) ?? []

  const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    baja: 'secondary',
    media: 'outline',
    alta: 'default',
    urgente: 'destructive',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Órdenes</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Today */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Hoy ({todayOrders.length})
        </h2>
        {todayOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes órdenes programadas para hoy.</p>
        ) : (
          <div className="space-y-3">
            {todayOrders.map((order) => (
              <Link key={order.id} href={`/operario/ordenes/${order.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{order.order_number}</span>
                          <Badge variant={priorityVariant[order.priority]}>{order.priority}</Badge>
                        </div>
                        <p className="text-sm">{order.description}</p>
                        {order.assets && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {(order.assets as { name: string; location: string; type: string }).name} —{' '}
                            {(order.assets as { name: string; location: string; type: string }).location}
                          </div>
                        )}
                        {order.clients && (
                          <p className="text-xs text-muted-foreground">
                            {(order.clients as { company_name: string }).company_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={order.status === 'en_proceso' ? 'default' : 'outline'}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcomingOrders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Próximas
          </h2>
          <div className="space-y-2">
            {upcomingOrders.map((order) => (
              <Link key={order.id} href={`/operario/ordenes/${order.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="text-sm font-medium">{order.order_number}</span>
                      <p className="text-xs text-muted-foreground">{order.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {order.scheduled_date
                        ? format(new Date(order.scheduled_date), 'd MMM', { locale: es })
                        : 'Sin fecha'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
