'use client'

import { useState } from 'react'
import { LoaderCircle, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { printAssetLabels, type LabelAsset } from '@/lib/assets'

/** Prints 6 × 4 cm QR stickers for the given assets (same layout as the app). */
export function PrintLabelsButton({
  assets, orgName, label = 'Imprimir etiqueta', className,
}: { assets: LabelAsset[]; orgName: string; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false)

  async function print() {
    setBusy(true)
    try {
      await printAssetLabels(assets, orgName)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={print}
      disabled={busy || assets.length === 0}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-semibold text-primary transition hover:bg-blue-100 disabled:opacity-60',
        className
      )}
    >
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Printer size={17} />}
      {label}
    </button>
  )
}
