'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

/** Thumbnails of evidence photos; a tap opens the photo full size. */
export function PhotoGallery({ urls, className }: { urls: string[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(null)
  if (urls.length === 0) return null

  return (
    <>
      <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 ${className ?? ''}`}>
        {urls.map((url, i) => (
          <button key={url} type="button" onClick={() => setOpen(url)} className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            {/* Signed Supabase Storage URLs: plain img avoids configuring next/image remote hosts */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto de evidencia ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Foto de evidencia" className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/90 p-4" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Cerrar" className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="Foto de evidencia" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  )
}
