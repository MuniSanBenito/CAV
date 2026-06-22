import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'
import ReportesClient from './ReportesClient'

const ALLOWED_ROLES = ['admin', 'carga', 'visualizador']

async function getAreas() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'areas',
      limit: 200,
      sort: 'nombre',
      overrideAccess: false,
    })
    return result.docs as { id: string; nombre: string }[]
  } catch {
    return []
  }
}

export default async function ReportesPage() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user || !ALLOWED_ROLES.includes(user.role as string)) {
    redirect('/login')
  }

  const areas = await getAreas()

  return <ReportesClient areas={areas} />
}
