'use client'

import React, { useEffect, useState } from 'react'
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

const estadoBadge: Record<string, string> = {
  pendiente: 'dash-badge--pending',
  en_proceso: 'dash-badge--progress',
  resuelto: 'dash-badge--resolved',
  rechazado: 'dash-badge--rejected',
}

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

export default function DashboardHome() {
  const [user, setUser] = useState<DashUser | null>(null)
  const [stats, setStats] = useState<ReclamoStats>({
    pendiente: 0, en_proceso: 0, resuelto: 0, rechazado: 0, total: 0,
  })
  const [recent, setRecent] = useState<ReclamoRecent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/reclamos?limit=0', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/reclamos?limit=5&sort=-createdAt', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([userData, allData, recentData]) => {
        if (userData?.user) {
          if (userData.user.role === 'ejecutor') {
            window.location.href = '/mis-reclamos'
            return
          }
          setUser(userData.user)
        }
        if (allData?.docs) {
          const docs = allData.docs as { estado: string }[]
          setStats({
            pendiente: docs.filter((d) => d.estado === 'pendiente').length,
            en_proceso: docs.filter((d) => d.estado === 'en_proceso').length,
            resuelto: docs.filter((d) => d.estado === 'resuelto').length,
            rechazado: docs.filter((d) => d.estado === 'rechazado').length,
            total: docs.length,
          })
        }

        if (recentData?.docs) setRecent(recentData.docs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  if (loading) {
    return (
      <div className="dash-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="dash-home">
      {/* Welcome header */}
      <div className="dash-welcome" style={{ animationDelay: '0s' }}>
        <div className="dash-welcome-text">
          <h1 className="dash-welcome-title">
            {greeting()}, <span className="dash-welcome-name">{user?.nombre || 'usuario'}</span>
          </h1>
          <p className="dash-welcome-sub">
            Panel de gestión del Centro de Atención al Vecino
          </p>
        </div>
        <div className="dash-welcome-actions">
          <Link href="/dashboard/reclamos" className="dash-action-btn dash-action-btn--secondary">
            <IconFileDescription size={18} />
            Ver Reclamos
          </Link>
          <Link href="/dashboard/reclamos/nuevo" className="dash-action-btn dash-action-btn--primary">
            <IconPlus size={18} />
            Nuevo Reclamo
          </Link>
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
              <span className="stat-card-number">
                {stats[key as keyof ReclamoStats]}
              </span>
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
            <Link href="/dashboard/reclamos/nuevo" className="dash-action-btn dash-action-btn--primary">
              <IconPlus size={18} />
              Cargar primer reclamo
            </Link>
          </div>
        ) : (
          <div className="dash-recent-list">
            {recent.map((r) => (
              <div key={r.id} className="dash-recent-item">
                <div className="dash-recent-item-info">
                  <span className="dash-recent-item-title">#{r.numero} — {r.tipo === 'reclamo' ? 'Reclamo' : r.tipo === 'sugerencia' ? 'Sugerencia' : r.tipo === 'denuncia' ? 'Denuncia' : 'Consulta'}</span>
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
