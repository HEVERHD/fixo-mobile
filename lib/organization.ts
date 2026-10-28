import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

export interface Organization {
  id: string
  name: string
  logo_url: string | null
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // matches the org-logos bucket limit
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** The caller's organization (RLS only returns their own). */
export async function fetchMyOrganization(): Promise<Organization | null> {
  const { data } = await supabase.from('organizations').select('id, name, logo_url').maybeSingle()
  return data
}

export type LogoUploadResult =
  | { ok: true; logoUrl: string }
  | { ok: false; reason: 'canceled' | 'too-large' | 'bad-type' | 'failed' }

/**
 * Lets an org admin pick a square image and stores it as the company logo.
 * Each upload gets a new file name so cached old logos are never shown.
 */
export async function pickAndUploadLogo(orgId: string): Promise<LogoUploadResult> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  })
  if (picked.canceled) return { ok: false, reason: 'canceled' }

  const asset = picked.assets[0]!
  const contentType = asset.mimeType ?? 'image/jpeg'
  if (!ALLOWED_TYPES.includes(contentType)) return { ok: false, reason: 'bad-type' }
  if (asset.fileSize && asset.fileSize > MAX_LOGO_BYTES) return { ok: false, reason: 'too-large' }

  const body = await (await fetch(asset.uri)).arrayBuffer()
  if (body.byteLength > MAX_LOGO_BYTES) return { ok: false, reason: 'too-large' }

  const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
  const path = `${orgId}/logo-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('org-logos')
    .upload(path, body, { contentType })
  if (uploadError) return { ok: false, reason: 'failed' }

  const { data: { publicUrl } } = supabase.storage.from('org-logos').getPublicUrl(path)
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: publicUrl })
    .eq('id', orgId)
  if (updateError) return { ok: false, reason: 'failed' }

  return { ok: true, logoUrl: publicUrl }
}
