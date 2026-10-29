import QRCode from 'qrcode'

// Same values as apps/mobile/lib/assets.ts: labels printed from the web and the app must match.
export type AssetStatus = 'activo' | 'en_mantenimiento' | 'fuera_de_servicio'

export const ASSET_STATUS_META: Record<AssetStatus, { label: string; chip: string }> = {
  activo: { label: 'Activo', chip: 'bg-green-100 text-green-800' },
  en_mantenimiento: { label: 'En mantenimiento', chip: 'bg-yellow-100 text-yellow-800' },
  fuera_de_servicio: { label: 'Fuera de servicio', chip: 'bg-red-100 text-red-800' },
}

/**
 * Printed stickers are permanent, so the QR holds a URL on our own domain:
 * <base>/q/<qr_code> (the app's EXPO_PUBLIC_ASSET_LINK_BASE must hold the same value).
 * Never change it once stickers are printed.
 */
export const ASSET_LINK_BASE = (process.env.NEXT_PUBLIC_ASSET_LINK_BASE || 'https://fixo.co').replace(/\/+$/, '')

export const assetLink = (qrCode: string) => `${ASSET_LINK_BASE}/q/${qrCode}`

const CODE_RE = /^FX-[A-Z0-9]{6,20}$/
export const isAssetCode = (code: string) => CODE_RE.test(code)

/** QR as an SVG string, for inline rendering and printed labels. */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#01184e', light: '#ffffff' } })
}

export interface LabelAsset {
  name: string
  qr_code: string
  location?: string | null
  clientName?: string | null
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Browser only: prints one 6 × 4 cm sticker per asset on a letter-size grid,
 * same layout as the app. Uses a hidden iframe so popup blockers don't interfere.
 */
export async function printAssetLabels(assets: LabelAsset[], orgName: string) {
  const labels = await Promise.all(assets.map(async (a) => `
    <div class="label">
      <div class="qr">${await qrSvg(assetLink(a.qr_code))}</div>
      <div class="info">
        <div class="org">${escapeHtml(orgName)}</div>
        <div class="name">${escapeHtml(a.name)}</div>
        ${a.clientName ? `<div class="meta">${escapeHtml(a.clientName)}</div>` : ''}
        ${a.location ? `<div class="meta">${escapeHtml(a.location)}</div>` : ''}
        <div class="code">${escapeHtml(a.qr_code)}</div>
      </div>
    </div>`))

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Etiquetas Fixo</title><style>
  @page { margin: 10mm; }
  body { margin: 0; font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
  .grid { display: flex; flex-wrap: wrap; gap: 4mm; }
  .label { width: 60mm; height: 40mm; box-sizing: border-box; border: 0.3mm dashed #9ca3af; border-radius: 2mm;
           padding: 3mm; display: flex; gap: 3mm; align-items: center; page-break-inside: avoid; }
  .qr { width: 30mm; height: 30mm; flex: none; }
  .qr svg { width: 100%; height: 100%; }
  .info { flex: 1; min-width: 0; }
  .org { font-size: 7pt; font-weight: 700; color: #01184E; text-transform: uppercase; }
  .name { font-size: 9pt; font-weight: 700; margin-top: 1mm; line-height: 1.15; }
  .meta { font-size: 7pt; color: #4b5563; margin-top: 0.8mm; }
  .code { font-size: 8pt; font-weight: 700; letter-spacing: 0.4pt; margin-top: 1.5mm; font-family: monospace; }
</style></head>
<body><div class="grid">${labels.join('')}</div></body></html>`

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)
  const win = frame.contentWindow!
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
  // Give the print dialog time to read the document before removing it
  setTimeout(() => frame.remove(), 60_000)
}
