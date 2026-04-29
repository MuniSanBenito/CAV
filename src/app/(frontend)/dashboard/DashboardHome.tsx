import React from 'react'
import Link from 'next/link'
import {
  IconFileDescription,
  IconPlus,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-react'
import { estadoLabel, estadoBadgeClass } from '@/lib/constants'

interface ReclamoStats {
  pendiente: number
  en_proceso: number
  resuelto: number
  rechazado: number
  total: number
}

interface ReclamoRecent {
  id: string
  numero: number
  tipo: string
  estado: string
  createdAt: string
}

interface DashUser {
  nombre: string
  apellido: string
  role: string
}

const estadoConfig: Record<string, { label: string; className: string; icon: typeof IconClock }> = {
  pendiente: { label: 'Pendientes', className: 'stat-card--pending', icon: IconClock },
  en_proceso: { label: 'En Proceso', className: 'stat-card--progress', icon: IconLoader },
  resuelto: { label: 'Resueltos', className: 'stat-card--resolved', icon: IconCircleCheck },
  rechazado: { label: 'Rechazados', className: 'stat-card--rejected', icon: IconAlertTriangle },
}

const estadoBadge = estadoBadgeClass

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardHome({
  user,
  stats,
  recent,
}: {
  user: DashUser
  stats: ReclamoStats
  recent: ReclamoRecent[]
}) {
  return (
    <div className="dash-home">
      {/* Welcome header */}
      <div className="dash-welcome" style={{ animationDelay: '0s' }}>
        <div className="dash-welcome-text">
          <h1 className="dash-welcome-title">
            {greeting()}, <span className="dash-welcome-name">{user?.nombre || 'usuario'}</span>
          </h1>
          <p className="dash-welcome-sub">Panel de gestión del Centro de Atención al Vecino</p>
        </div>
        <div className="dash-welcome-actions">
          <Link href="/dashboard/reclamos" className="dash-action-btn dash-action-btn--secondary">
            <IconFileDescription size={18} />
            Ver Reclamos
          </Link>
          {user?.role !== 'visualizador' && (
            <Link
              href="/dashboard/reclamos/nuevo"
              className="dash-action-btn dash-action-btn--primary"
            >
              <IconPlus size={18} />
              Nuevo Reclamo
            </Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="dash-stats-grid" style={{ animationDelay: '0.1s' }}>
        {Object.entries(estadoConfig).map(([key, cfg]) => (
          <div key={key} className={`stat-card ${cfg.className}`}>
            <div className="stat-card-icon">
              <cfg.icon size={24} stroke={1.5} />
            </div>
            <div className="stat-card-data">
              <span className="stat-card-number">{stats[key as keyof ReclamoStats]}</span>
              <span className="stat-card-label">{cfg.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="dash-recent" style={{ animationDelay: '0.2s' }}>
        <div className="dash-recent-header">
          <h2 className="dash-section-title">
            <IconSparkles size={20} stroke={1.5} />
            Actividad Reciente
          </h2>
          <Link href="/dashboard/reclamos" className="dash-see-all">
            Ver todos <IconArrowRight size={16} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="dash-empty">
            <IconFileDescription size={48} stroke={1} className="dash-empty-icon" />
            <p>No hay reclamos cargados aún.</p>
            {user?.role !== 'visualizador' && (
              <Link
                href="/dashboard/reclamos/nuevo"
                className="dash-action-btn dash-action-btn--primary"
              >
                <IconPlus size={18} />
                Cargar primer reclamo
              </Link>
            )}
          </div>
        ) : (
          <div className="dash-recent-list">
            {recent.map((r) => (
              <div key={r.id} className="dash-recent-item">
                <div className="dash-recent-item-info">
                  <span className="dash-recent-item-title">
                    #{r.numero} —{' '}
                    {r.tipo === 'reclamo'
                      ? 'Reclamo'
                      : r.tipo === 'sugerencia'
                        ? 'Sugerencia'
                        : r.tipo === 'denuncia'
                          ? 'Denuncia'
                          : 'Consulta'}
                  </span>
                  <span className="dash-recent-item-date">
                    {new Date(r.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className={`dash-badge ${estadoBadge[r.estado] || ''}`}>
                  {estadoLabel[r.estado] || r.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
