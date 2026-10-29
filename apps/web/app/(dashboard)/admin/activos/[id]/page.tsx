import { AssetSheet } from '@/components/assets/AssetSheet'

export default async function AssetDetailPage({ params }: PageProps<'/admin/activos/[id]'>) {
  const { id } = await params
  return <AssetSheet id={id} mode="admin" backHref="/admin/activos" />
}
