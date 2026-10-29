'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

interface QRDisplayProps {
  assetId: string
  assetName: string
  size?: number
}

export function QRDisplay({ assetId, assetName, size = 200 }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/qr/${assetId}`
    : `/qr/${assetId}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }
  }, [url, size])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `QR-${assetName.replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR - ${assetName}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;padding:20px;font-family:sans-serif;">
        <img src="${dataUrl}" style="width:200px;height:200px;" />
        <p style="margin-top:12px;font-size:14px;font-weight:bold;">${assetName}</p>
        <p style="font-size:11px;color:#666;">${url}</p>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg border p-2" />
      <p className="max-w-[200px] break-all text-center text-xs text-muted-foreground">{url}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download size={14} className="mr-1" /> Descargar
        </Button>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer size={14} className="mr-1" /> Imprimir
        </Button>
      </div>
    </div>
  )
}
