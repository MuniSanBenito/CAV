import ReclamoDetailClient from './ReclamoDetailClient'

export function generateMetadata() {
  return {
    title: 'Detalle de Reclamo',
  }
}

export default async function ReclamoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReclamoDetailClient id={id} />
}
