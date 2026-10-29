import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { QuotePDFDocument } from '@/components/financial/QuotePDFDocument'
import { QUOTE_SELECT, type QuoteDetail } from '@/components/financial/QuoteView'

/** Quote PDF. RLS decides who can read the quote; drafts are only for the company's admins. */
export async function GET(request: NextRequest) {
  const quoteId = z.uuid().safeParse(request.nextUrl.searchParams.get('quoteId'))
  if (!quoteId.success) return NextResponse.json({ error: 'quoteId inválido' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [{ data }, { data: profile }, { data: org }] = await Promise.all([
    supabase.from('quotes').select(QUOTE_SELECT).eq('id', quoteId.data).maybeSingle(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('organizations').select('name').maybeSingle(),
  ])
  const quote = data as unknown as QuoteDetail | null
  if (!quote || (quote.status === 'borrador' && profile?.role !== 'admin')) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const buffer = await renderToBuffer(QuotePDFDocument({ quote, issuer: org?.name ?? 'Fixo' }))
  const filename = `cotizacion-${quote.quote_number.replace(/[^A-Za-z0-9-]/g, '')}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
