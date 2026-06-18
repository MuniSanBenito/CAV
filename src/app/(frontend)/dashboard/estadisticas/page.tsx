import React from 'react'
import { IconChartBar, IconClock, IconMapPin, IconBuildingCommunity, IconLoader } from '@tabler/icons-react'

interface StatsResponse {
  porEstado: {
    pendiente: number
    en_proceso: number
    resuelto: number
    rechazado: number
    total: number
  }
  porArea: { nombre: string; count: number }[]
  porBarrio: { nombre: string; count: number }[]
  porConcepto: { nombre: string; count: number }[]
  tiempoResolucion: { promedio: number; min: number; max: number }
  vencidos: number
}

async function getStats(): Promise<StatsResponse> {
  try {
    const res = await fetch('/api/stats', { credentials: 'include' })
    if (!res.ok) throw new Error('Error fetching stats')
    return res.json()
  } catch {
    return {
      porEstado: { pendiente: 0, en_proceso: 0, resuelto: 0, rechazado: 0, total: 0 },
      porArea: [],
      porBarrio: [],
      porConcepto: [],
      tiempoResolucion: { promedio: 0, min: 0, max: 0 },
      vencidos: 0,
    }
  }
}

export default async function EstadisticasPage() {
  const stats = await getStats()

  return (
    <div className="dash-home">
      <div className="dash-welcome" style={{ animationDelay: '0s' }}>
        <div className="dash-welcome-text">
          <h1 className="dash-welcome-title">Estadísticas</h1>
          <p className="dash-welcome-sub">Métricas y análisis de reclamos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-stats-grid" style={{ animationDelay: '0.1s' }}>
        <div className="stat-card stat-card--pending">
          <div className="stat-card-icon">
            <IconClock size={24} stroke={1.5} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-number">{stats.porEstado.pendiente}</span>
            <span className="stat-card-label">Pendientes</span>
          </div>
        </div>
        <div className="stat-card stat-card--progress">
          <div className="stat-card-icon">
            <IconLoader size={24} stroke={1.5} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-number">{stats.porEstado.en_proceso}</span>
            <span className="stat-card-label">En Proceso</span>
          </div>
        </div>
        <div className="stat-card stat-card--resolved">
          <div className="stat-card-icon">
            <IconChartBar size={24} stroke={1.5} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-number">{stats.porEstado.resuelto}</span>
            <span className="stat-card-label">Resueltos</span>
          </div>
        </div>
        <div className="stat-card stat-card--rejected">
          <div className="stat-card-icon">
            <IconChartBar size={24} stroke={1.5} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-number">{stats.vencidos}</span>
            <span className="stat-card-label">Vencidos (SLA)</span>
          </div>
        </div>
      </div>

      {/* Tiempo de resolución */}
      <div className="nuevo-section" style={{ animationDelay: '0.2s' }}>
        <div className="nuevo-section-header">
          <IconClock size={20} stroke={1.5} />
          <span>Tiempo de Resolución (días)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--theme-elevation-50)', borderRadius: 'var(--border-radius-m)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--theme-text-muted)' }}>Promedio</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.tiempoResolucion.promedio.toFixed(1)}
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--theme-elevation-50)', borderRadius: 'var(--border-radius-m)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--theme-text-muted)' }}>Más rápido</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.tiempoResolucion.min.toFixed(1)}
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'var(--theme-elevation-50)', borderRadius: 'var(--border-radius-m)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--theme-text-muted)' }}>Más lento</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.tiempoResolucion.max.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Por área */}
      {stats.porArea.length > 0 && (
        <div className="nuevo-section" style={{ animationDelay: '0.3s' }}>
          <div className="nuevo-section-header">
            <IconBuildingCommunity size={20} stroke={1.5} />
            <span>Reclamos por Área (Top 10)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.porArea.map((item) => (
              <div
                key={item.nombre}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--theme-elevation-50)',
                  borderRadius: 'var(--border-radius-s)',
                }}
              >
                <span>{item.nombre || 'Sin área'}</span>
                <span style={{ fontWeight: 600 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por barrio */}
      {stats.porBarrio.length > 0 && (
        <div className="nuevo-section" style={{ animationDelay: '0.4s' }}>
          <div className="nuevo-section-header">
            <IconMapPin size={20} stroke={1.5} />
            <span>Reclamos por Barrio (Top 10)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.porBarrio.map((item) => (
              <div
                key={item.nombre}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--theme-elevation-50)',
                  borderRadius: 'var(--border-radius-s)',
                }}
              >
                <span>{item.nombre || 'Sin barrio'}</span>
                <span style={{ fontWeight: 600 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por concepto */}
      {stats.porConcepto.length > 0 && (
        <div className="nuevo-section" style={{ animationDelay: '0.5s' }}>
          <div className="nuevo-section-header">
            <IconChartBar size={20} stroke={1.5} />
            <span>Reclamos por Concepto (Top 10)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.porConcepto.map((item) => (
              <div
                key={item.nombre}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--theme-elevation-50)',
                  borderRadius: 'var(--border-radius-s)',
                }}
              >
                <span>{item.nombre || 'Sin concepto'}</span>
                <span style={{ fontWeight: 600 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
