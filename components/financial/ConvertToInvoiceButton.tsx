'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Receipt } from 'lucide-react'

interface Props {
  quoteId: string
  clientId: string
  total: number
}

export function ConvertToInvoiceButton({ quoteId, clientId, total }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleConvert() {
    if (!confirm('¿Convertir esta cotización en cuenta de cobro?')) return
    setLoading(true)

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { error } = await supabase.from('invoices').insert({
      quote_id: quoteId,
      client_id: clientId,
      invoice_number: '',
      amount: total,
      status: 'pendiente',
      due_date: dueDate.toISOString().split('T')[0],
    })

    setLoading(false)
    if (!error) {
      router.push('/admin/financiero')
      router.refresh()
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleConvert} disabled={loading}>
      <Receipt size={14} className="mr-1" />
      {loading ? 'Convirtiendo...' : 'Crear cuenta de cobro'}
    </Button>
  )
}
