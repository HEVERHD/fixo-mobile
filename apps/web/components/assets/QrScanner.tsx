'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CameraOff, LoaderCircle, ScanQrCode } from 'lucide-react'
import { parseScannedCode } from '@/lib/assets'
import { inputClass } from '@/components/app/form'

type CameraState = 'starting' | 'scanning' | 'denied' | 'unavailable'

/**
 * Reads an equipment sticker with the camera (html5-qrcode, loaded only in the browser)
 * and opens /q/<code>, which resolves it to the right sheet for the viewer's role.
 * The code can also be typed, for devices without a camera.
 */
export function QrScanner() {
  const router = useRouter()
  const [state, setState] = useState<CameraState>('starting')
  const [invalid, setInvalid] = useState(false)
  const [manual, setManual] = useState('')
  const handled = useRef(false)

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null
    let cancelled = false

    import('html5-qrcode').then(async ({ Html5Qrcode }) => {
      if (cancelled) return
      const instance = new Html5Qrcode('qr-reader', { verbose: false })
      scanner = instance
      try {
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s } } },
          (text) => {
            if (handled.current) return
            const code = parseScannedCode(text)
            if (!code) {
              setInvalid(true)
              return
            }
            handled.current = true
            router.push(`/q/${code}`)
          },
          () => { /* no QR in this frame */ }
        )
        if (!cancelled) setState('scanning')
      } catch (err) {
        if (!cancelled) setState(String(err).toLowerCase().includes('permission') ? 'denied' : 'unavailable')
      }
    }).catch(() => setState('unavailable'))

    return () => {
      cancelled = true
      if (scanner?.isScanning) scanner.stop().catch(() => {})
    }
  }, [router])

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const code = parseScannedCode(manual)
    if (code) router.push(`/q/${code}`)
    else setInvalid(true)
  }

  return (
    <div className="space-y-5">
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-navy">
        <div id="qr-reader" className="h-full w-full [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover" />
        {state !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            {state === 'starting' && <><LoaderCircle size={32} className="animate-spin text-accent-cyan" /><p className="mt-3 text-sm text-blue-100">Abriendo la cámara…</p></>}
            {state === 'denied' && <><CameraOff size={32} className="text-blue-200" /><p className="mt-3 text-sm text-blue-100">Permite el acceso a la cámara en tu navegador o escribe el código abajo.</p></>}
            {state === 'unavailable' && <><CameraOff size={32} className="text-blue-200" /><p className="mt-3 text-sm text-blue-100">No encontramos una cámara disponible. Escribe el código de la etiqueta abajo.</p></>}
          </div>
        )}
        {state === 'scanning' && (
          <div aria-hidden className="pointer-events-none absolute inset-x-[15%] h-0.5 animate-scan bg-accent-cyan shadow-[0_0_12px_2px_#06b9fe]" />
        )}
      </div>

      {invalid && (
        <p role="alert" className="mx-auto max-w-md rounded-2xl bg-amber-50 p-3 text-center text-sm text-amber-800">
          Ese código no es una etiqueta de Fixo. Apunta a la etiqueta del equipo (FX-…).
        </p>
      )}

      <form onSubmit={submitManual} className="mx-auto flex max-w-md gap-2">
        <input
          aria-label="Código de la etiqueta"
          value={manual}
          onChange={(e) => { setManual(e.target.value); setInvalid(false) }}
          placeholder="O escribe el código: FX-…"
          className={`${inputClass} h-12 flex-1 font-mono uppercase`}
        />
        <button type="submit" className="flex h-12 items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          <ScanQrCode size={17} className="sm:hidden" /><span className="hidden sm:inline">Abrir</span> <ArrowRight size={16} className="hidden sm:block" />
        </button>
      </form>
    </div>
  )
}
