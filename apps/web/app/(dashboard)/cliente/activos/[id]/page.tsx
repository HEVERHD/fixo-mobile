import { AssetSheet } from '@/components/assets/AssetSheet'

// RLS only returns the client's own assets; anything else is a 404
export default async function ClienteAssetPage({ params }: PageProps<'/cliente/activos/[id]'>) {
  const { id } = await params
  return <AssetSheet id={id} mode="cliente" backHref="/cliente/activos" />
}
