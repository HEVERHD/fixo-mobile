import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

/**
 * Evidence photos of work reports: private bucket from supabase/migrations/*_work_photos.sql.
 * Objects live at <organization_id>/<work_order_id>/<file>; maintenance_records.photos stores
 * those paths. Same rules as apps/web/lib/photos.ts.
 */
export const WORK_PHOTOS_BUCKET = 'work-photos'
export const MAX_PHOTOS = 8

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  // iOS: hand back JPEG instead of HEIC, which browsers on the web portal can't show
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
}

export type PickResult =
  | { ok: true; assets: ImagePicker.ImagePickerAsset[] }
  | { ok: false; reason: 'canceled' | 'permission' }

/** Takes a photo with the camera or picks up to `limit` from the gallery. */
export async function pickPhotos(source: 'camera' | 'library', limit: number): Promise<PickResult> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return { ok: false, reason: 'permission' }
  }
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : await ImagePicker.launchImageLibraryAsync({ ...PICKER_OPTIONS, allowsMultipleSelection: true, selectionLimit: limit })
  if (result.canceled) return { ok: false, reason: 'canceled' }
  return { ok: true, assets: result.assets.slice(0, limit) }
}

/** Uploads one photo; returns its storage path, or null if the type isn't allowed or the upload failed. */
export async function uploadWorkPhoto(orgId: string, orderId: string, asset: ImagePicker.ImagePickerAsset) {
  const contentType = asset.mimeType ?? 'image/jpeg'
  const ext = EXT[contentType]
  if (!ext) return null
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const path = `${orgId}/${orderId}/${id}.${ext}`
  const body = await (await fetch(asset.uri)).arrayBuffer()
  // Storage RLS only accepts the technician assigned to this order while it is en_proceso
  const { error } = await supabase.storage.from(WORK_PHOTOS_BUCKET).upload(path, body, { contentType })
  return error ? null : path
}

export async function removeWorkPhoto(path: string) {
  await supabase.storage.from(WORK_PHOTOS_BUCKET).remove([path])
}

/** Short-lived URLs for private photos, in the same order (missing ones are skipped). */
export async function signPhotoUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return []
  const { data } = await supabase.storage.from(WORK_PHOTOS_BUCKET).createSignedUrls(paths, 60 * 60)
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
  return paths.map((p) => byPath.get(p)).filter((u): u is string => !!u)
}
