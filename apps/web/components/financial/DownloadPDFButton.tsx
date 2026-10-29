'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

interface Props {
  quoteId: string
}

export function DownloadPDFButton({ quoteId }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pdf?quoteId=${quoteId}`)
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cotizacion-${quoteId.slice(0, 8)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} disabled={loading}>
      <FileDown size={14} className="mr-1" />
      {loading ? 'Generando...' : 'Descargar PDF'}
    </Button>
  )
}
