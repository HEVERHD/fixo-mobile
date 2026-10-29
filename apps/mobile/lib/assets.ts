import QRCode from 'qrcode'
import * as Print from 'expo-print'
import { supabase } from '@/lib/supabase'

export type AssetStatus = 'activo' | 'en_mantenimiento' | 'fuera_de_servicio'

export const ASSET_STATUS_META: Record<AssetStatus, { label: string; chip: string; text: string }> = {
  activo: { label: 'Activo', chip: 'bg-green-100', text: 'text-green-800' },
  en_mantenimiento: { label: 'En mantenimiento', chip: 'bg-yellow-100', text: 'text-yellow-800' },
  fuera_de_servicio: { label: 'Fuera de servicio', chip: 'bg-red-100', text: 'text-red-800' },
}

/**
 * Printed stickers are permanent, so the QR holds a web URL on our own domain:
 * <base>/q/<qr_code>. The app reads it today; later the same link can open a
 * public page or the app (universal links). Override per environment with
 * EXPO_PUBLIC_ASSET_LINK_BASE, never change it once stickers are printed.
 */
export const ASSET_LINK_BASE = (process.env.EXPO_PUBLIC_ASSET_LINK_BASE || 'https://fixo.co').replace(/\/+$/, '')

export const assetLink = (qrCode: string) => `${ASSET_LINK_BASE}/q/${qrCode}`

const CODE_RE = /^FX-[A-Z0-9]{6,20}$/

/**
 * Extracts the asset code from whatever a QR holds: our https link (any host,
 * so a domain change keeps old stickers readable), fixo://q/… or the bare code.
 */
export function parseScannedCode(data: string): string | null {
  const text = data.trim()
  const fromPath = text.match(/\/q\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/)
  const code = (fromPath ? fromPath[1] : text).toUpperCase()
  return CODE_RE.test(code) ? code : null
}

/** Asset id for a code, or null if it doesn't exist or belongs to another company (RLS). */
export async function findAssetIdByCode(code: string) {
  const { data } = await supabase.from('assets').select('id').eq('qr_code', code).maybeSingle()
  return data?.id ?? null
}

/** QR as an SVG string: rendered in the app (SvgXml) and inlined in printed labels. */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
}

export interface LabelAsset {
  name: string
  qr_code: string
  location?: string | null
  clientName?: string | null
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Opens the system print dialog with one 6 × 4 cm sticker per asset, on a letter-size grid. */
export async function printAssetLabels(assets: LabelAsset[], orgName: string) {
  const labels = await Promise.all(assets.map(async a => `
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
<html><head><meta charset="utf-8"><style>
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

  await Print.printAsync({ html })
}
