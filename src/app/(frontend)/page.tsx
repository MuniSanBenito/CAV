import React from 'react'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { IconShieldLock, IconUserCircle, IconArrowRight } from '@tabler/icons-react'
import './styles.css'

export default async function HomePage() {
  // Si ya hay sesión, redirigir al destino según rol.
  // Importante: el redirect() de Next tira una excepción especial,
  // por eso lo ejecutamos fuera del try/catch.
  let redirectTo: string | null = null
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await nextHeaders() })
    if (user) {
      redirectTo = user.role === 'ejecutor' ? '/mis-reclamos' : '/dashboard'
    }
  } catch {
    // Si falla la verificación, cae a la vista pública
  }
  if (redirectTo) redirect(redirectTo)

  return (
    <div className="home-layout">
      {/* Decorative background shapes */}
      <div className="home-bg-shape home-bg-shape--1" />
      <div className="home-bg-shape home-bg-shape--2" />
      <div className="home-bg-shape home-bg-shape--3" />

      <main className="home-container">
        {/* Header Section */}
        <header className="home-header">
          <div className="home-badge">
            <span className="home-badge-dot"></span>
            Portal Municipal
          </div>
          <h1 className="home-title">
            <span className="home-title-light">Centro de</span>
            <br />
            Atención al Vecino
          </h1>
          <p className="home-subtitle">
            Plataforma de gestión, carga y resolución de reclamos y expedientes para el personal
            municipal de San Benito.
          </p>
        </header>

        {/* Unified Portal Access */}
        <div className="home-grid">
          {/* Main System Login */}
          <a href="/login" className="access-card access-card--primary">
            <div className="access-card-glow"></div>
            <div className="access-card-content">
              <div className="access-card-icon-wrap">
                <IconUserCircle size={36} stroke={1.5} />
              </div>
              <div className="access-card-text">
                <h2>Ingreso al Sistema</h2>
                <p>Acceso a la plataforma de gestión para personal municipal.</p>
              </div>
              <div className="access-card-action">
                <span>Ingresar</span>
                <IconArrowRight size={20} className="action-arrow" />
              </div>
            </div>
          </a>
        </div>
      </main>

      {/* Footer with hidden admin link */}
      <footer className="home-footer-clean">
        <p>
          © {new Date().getFullYear()} Municipalidad de San Benito. Todos los derechos reservados.
        </p>
        <div className="admin-link-wrapper">
          <a href="/admin" className="admin-link-hidden">
            <IconShieldLock size={14} stroke={1.5} />
            <span>Administración de Sistemas</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
