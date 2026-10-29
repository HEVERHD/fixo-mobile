// Evidence photos of work reports: private bucket from supabase/migrations/*_work_photos.sql.
// Objects live at <organization_id>/<work_order_id>/<file>; maintenance_records.photos stores those paths.
import type { SupabaseClient } from '@supabase/supabase-js'

export const WORK_PHOTOS_BUCKET = 'work-photos'
export const MAX_PHOTOS = 8

const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[A-Za-z0-9-]+\.(jpg|png|webp)$/

/** True when `path` is a photo of this order in this company (never trust paths sent by the browser). */
export const isOrderPhotoPath = (path: string, orgId: string, orderId: string) =>
  PATH_RE.test(path) && path.startsWith(`${orgId}/${orderId}/`)

/** Short-lived URLs for private photos, keyed by path. RLS on storage decides what the viewer may read. */
export async function signPhotoUrls(supabase: SupabaseClient, paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data } = await supabase.storage.from(WORK_PHOTOS_BUCKET).createSignedUrls(unique, 60 * 60)
  const entries: [string, string][] = []
  for (const d of data ?? []) if (d.path && d.signedUrl) entries.push([d.path, d.signedUrl])
  return Object.fromEntries(entries)
}
