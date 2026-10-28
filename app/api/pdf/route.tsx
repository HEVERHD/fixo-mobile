import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDFDocument } from '@/components/financial/QuotePDFDocument'
import React from 'react'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const quoteId = searchParams.get('quoteId')
  if (!quoteId) return NextResponse.json({ error: 'quoteId required' }, { status: 400 })

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(company_name, nit, address, contact_email), quote_items(*)')
    .eq('id', quoteId)
    .single()

  if (error || !quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(QuotePDFDocument as React.ComponentType<{ quote: typeof quote }>, { quote })
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${(quote as { quote_number: string }).quote_number}.pdf"`,
    },
  })
}
