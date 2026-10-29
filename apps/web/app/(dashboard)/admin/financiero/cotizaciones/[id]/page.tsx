import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ArrowLeft, FileDown, Receipt } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ConvertToInvoiceButton } from '@/components/financial/ConvertToInvoiceButton'
import { DownloadPDFButton } from '@/components/financial/DownloadPDFButton'

export default async function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(company_name, nit, address, contact_email), quote_items(*)')
    .eq('id', id)
    .single()

  if (!quote) notFound()

  const quoteStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    borrador: 'outline',
    enviada: 'secondary',
    aprobada: 'default',
    rechazada: 'destructive',
  }

  const client = quote.clients as {
    company_name: string; nit?: string; address?: string; contact_email?: string
  } | null

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/financiero">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Volver</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
            <Badge variant={quoteStatusVariant[quote.status]}>{quote.status}</Badge>
          </div>
          <p className="text-muted-foreground">{client?.company_name}</p>
        </div>
        <div className="flex gap-2">
          <DownloadPDFButton quoteId={quote.id} />
          {quote.status === 'aprobada' && (
            <ConvertToInvoiceButton quoteId={quote.id} clientId={quote.client_id} total={quote.total} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{client?.company_name}</CardTitle>
              {client?.nit && <p className="text-sm text-muted-foreground">NIT: {client.nit}</p>}
              {client?.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Fecha: {format(new Date(quote.created_at), "d 'de' MMMM yyyy", { locale: es })}</p>
              {quote.valid_until && (
                <p>Válida hasta: {format(new Date(quote.valid_until), "d 'de' MMMM yyyy", { locale: es })}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Und</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(quote.quote_items as Array<{
                id: string; description: string; unit: string; quantity: number; unit_price: number; total: number
              }>)?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.unit}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity).toLocaleString('es-CO')}</TableCell>
                  <TableCell className="text-right">${Number(item.unit_price).toLocaleString('es-CO')}</TableCell>
                  <TableCell className="text-right font-medium">${Number(item.total).toLocaleString('es-CO')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(quote.subtotal).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AIU ({quote.aiu_pct}%)</span>
              <span>${Number(quote.aiu_amount).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA ({quote.tax_pct}%)</span>
              <span>${Number(quote.tax_amount).toLocaleString('es-CO')}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${Number(quote.total).toLocaleString('es-CO')}</span>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-4 rounded-md bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">Notas y condiciones:</p>
              <p className="text-sm mt-1">{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
