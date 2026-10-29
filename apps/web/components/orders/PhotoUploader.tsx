'use client'

import { useRef, useState } from 'react'
import { Camera, LoaderCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MAX_PHOTOS, WORK_PHOTOS_BUCKET } from '@/lib/photos'

export interface UploadedPhoto { path: string; preview: string }

const MAX_SIDE = 1600

/** Downscales to at most 1600 px and re-encodes as JPEG, so phone photos upload fast. */
async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.8))
}

/**
 * Uploads evidence photos straight to Storage (RLS only lets the assigned technician
 * write while the order is en_proceso). The parent sends the paths with the report.
 */
export function PhotoUploader({
  orgId, orderId, photos, onChange,
}: { orgId: string; orderId: string; photos: UploadedPhoto[]; onChange: (p: UploadedPhoto[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storage = () => createClient().storage.from(WORK_PHOTOS_BUCKET)

  async function add(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setBusy(true)
    const room = MAX_PHOTOS - photos.length
    const added: UploadedPhoto[] = []
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const blob = await toJpeg(file)
        const path = `${orgId}/${orderId}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await storage().upload(path, blob, { contentType: 'image/jpeg' })
        if (upErr) throw upErr
        added.push({ path, preview: URL.createObjectURL(blob) })
      }
      if (files.length > room) setError(`Máximo ${MAX_PHOTOS} fotos por reporte.`)
    } catch {
      setError('No pudimos subir una foto. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      onChange([...photos, ...added])
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  async function remove(photo: UploadedPhoto) {
    onChange(photos.filter((p) => p.path !== photo.path))
    URL.revokeObjectURL(photo.preview)
    await storage().remove([photo.path])
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">
        Fotos de evidencia <span className="font-normal text-gray-400">(opcional, máximo {MAX_PHOTOS})</span>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.path} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {/* Local object URL preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(p)} aria-label={`Quitar foto ${i + 1}`} className="absolute top-1 right-1 rounded-full bg-navy/70 p-1 text-white hover:bg-navy">
              <X size={14} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={22} className="animate-spin" /> : <Camera size={22} />}
            <span className="text-xs font-medium">{busy ? 'Subiendo…' : 'Agregar'}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
