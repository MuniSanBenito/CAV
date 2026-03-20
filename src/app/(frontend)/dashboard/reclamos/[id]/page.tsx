import React from 'react'
import ReclamoDetailClient from './ReclamoDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return {
    title: `Detalle de Reclamo - CAV San Benito`,
  }
}

export default async function ReclamoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReclamoDetailClient id={id} />
}
