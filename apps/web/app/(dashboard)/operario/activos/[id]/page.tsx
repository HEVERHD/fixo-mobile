import { AssetSheet } from '@/components/assets/AssetSheet'

// What a technician sees after scanning a sticker (RLS scopes it to their company)
export default async function OperarioAssetPage({ params }: PageProps<'/operario/activos/[id]'>) {
  const { id } = await params
  return <AssetSheet id={id} mode="operario" backHref="/operario" />
}
