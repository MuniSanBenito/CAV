import ContribuyenteDetailClient from './ContribuyenteDetailClient'

export function generateMetadata() {
  return {
    title: 'Detalle de Contribuyente',
  }
}

export default async function ContribuyenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContribuyenteDetailClient id={id} />
}
