import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function FinancieroPage() {
  const supabase = await createClient()

  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, quote_number, total, status, created_at, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalPending = invoices
    ?.filter((i) => i.status === 'pendiente' || i.status === 'abonado')
    .reduce((acc, i) => acc + Number(i.amount), 0) ?? 0

  const totalCollected = invoices
    ?.filter((i) => i.status === 'pagado')
    .reduce((acc, i) => acc + Number(i.amount), 0) ?? 0

  const invoiceStatusColor: Record<string, string> = {
    pendiente: 'bg-yellow-50 text-yellow-700',
    abonado: 'bg-blue-50 text-blue-700',
    pagado: 'bg-green-50 text-green-700',
    en_mora: 'bg-red-50 text-red-700',
  }

  const quoteStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    borrador: 'outline',
    enviada: 'secondary',
    aprobada: 'default',
    rechazada: 'destructive',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Módulo Financiero</h1>
          <p className="text-muted-foreground">Cotizaciones y cuentas de cobro</p>
        </div>
        <Link href="/admin/financiero/cotizaciones/nueva">
          <Button><Plus size={16} className="mr-2" /> Nueva Cotización</Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Por cobrar</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              ${totalPending.toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalCollected.toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quotes?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Cotizaciones recientes</CardTitle>
            <Link href="/admin/financiero/cotizaciones/nueva" className="text-sm text-primary hover:underline">
              Nueva
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotes && quotes.length > 0 ? (
              quotes.map((q) => (
                <Link key={q.id} href={`/admin/financiero/cotizaciones/${q.id}`}>
                  <div className="flex items-center justify-between rounded-md border p-3 hover:bg-accent cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{q.quote_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {(q.clients as { company_name: string } | null)?.company_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${Number(q.total).toLocaleString('es-CO')}</p>
                      <Badge variant={quoteStatusVariant[q.status]} className="text-xs">{q.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay cotizaciones.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Cuentas de cobro</CardTitle>
            <Link href="/admin/financiero/facturas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {(inv.clients as { company_name: string } | null)?.company_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${Number(inv.amount).toLocaleString('es-CO')}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColor[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay cuentas de cobro.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
