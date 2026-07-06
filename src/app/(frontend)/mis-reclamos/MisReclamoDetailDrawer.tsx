'use client'

import type { ReclamoEjecutor } from '@/app/(frontend)/mis-reclamos/types'
import {
  estadoBadgeClass,
  estadoLabel,
  getSlaStatus,
  medioLabel,
  prioridadBadgeClass,
  prioridadLabel,
  slaBadgeClass,
  slaLabel,
  tipoLabel,
} from '@/lib/constants'
import { getMediaUrl } from '@/lib/media'
import {
  formatFechaLarga,
  formatFechaRelativa,
  getAreaNombre,
  getConceptoNombre,
  getContribuyenteNombre,
  getGoogleMapsUrl,
  getReclamoCoords,
  isTerminalEstado,
} from '@/lib/reclamo-utils'
import {
  IconArrowLeft,
  IconClock,
  IconExternalLink,
  IconHistory,
  IconMapPin,
  IconPhone,
  IconUser,
  IconX,
} from '@tabler/icons-react'

interface Props {
  reclamo: ReclamoEjecutor
  onClose: () => void
  onActuar: (reclamo: ReclamoEjecutor) => void
}

export default function MisReclamoDetailDrawer({ reclamo, onClose, onActuar }: Props) {
  const slaStatus = getSlaStatus(reclamo.fechaCompromiso, reclamo.estado)
  const coords = getReclamoCoords(reclamo)
  const conceptoNombre = getConceptoNombre(reclamo.concepto)
  const areaNombre = getAreaNombre(reclamo.area_derivada)
  const contribuyenteNombre = getContribuyenteNombre(reclamo.contribuyente)
  const contribuyente =
    reclamo.contribuyente && typeof reclamo.contribuyente === 'object'
      ? reclamo.contribuyente
      : null

  const ubicacionLinea = [
    reclamo.calle || reclamo.ubicacion?.direccionNormalizada,
    reclamo.ubicacion?.barrio,
    reclamo.ubicacion?.localidad,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mis-reclamos-drawer-overlay">
      <div className="mis-reclamos-drawer-backdrop" onClick={onClose} />

      <div className="mis-reclamos-drawer mis-reclamos-drawer--detail">
        <div className="mis-reclamos-drawer-handle" />

        <div className="mis-reclamos-drawer-header">
          <div>
            <h2 className="mis-reclamos-drawer-title">Reclamo #{reclamo.numero}</h2>
            <p className="mis-reclamo-detail-subtitle">
              {tipoLabel[reclamo.tipo] || reclamo.tipo} · {formatFechaRelativa(reclamo.createdAt)}
            </p>
          </div>
          <button className="mis-reclamos-drawer-close" onClick={onClose} type="button">
            <IconX size={18} />
          </button>
        </div>

        <div className="mis-reclamos-drawer-body mis-reclamo-detail-body">
          <div className="mis-reclamo-detail-badges">
            <span className={`dash-badge ${estadoBadgeClass[reclamo.estado] || ''}`}>
              {estadoLabel[reclamo.estado] || reclamo.estado}
            </span>
            <span className={`dash-badge ${prioridadBadgeClass[reclamo.prioridad] || ''}`}>
              {prioridadLabel[reclamo.prioridad] || reclamo.prioridad}
            </span>
            {slaStatus && (
              <span className={`dash-badge ${slaBadgeClass[slaStatus] || ''}`}>
                SLA: {slaLabel[slaStatus]}
              </span>
            )}
          </div>

          {conceptoNombre && (
            <div className="mis-reclamo-detail-section">
              <div className="mis-reclamos-drawer-section-label">Concepto</div>
              <p className="mis-reclamo-detail-text">{conceptoNombre}</p>
            </div>
          )}

          <div className="mis-reclamo-detail-section">
            <div className="mis-reclamos-drawer-section-label">Descripción</div>
            <p className="mis-reclamo-detail-text mis-reclamo-detail-text--emphasis">
              {reclamo.descripcion}
            </p>
          </div>

          {ubicacionLinea && (
            <div className="mis-reclamo-detail-section">
              <div className="mis-reclamos-drawer-section-label">Ubicación</div>
              <div className="mis-reclamo-detail-row">
                <IconMapPin size={16} />
                <span>{ubicacionLinea}</span>
              </div>
              {coords && (
                <a
                  href={getGoogleMapsUrl(coords.lat, coords.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mis-reclamo-detail-maps-link"
                >
                  <IconExternalLink size={15} />
                  Abrir en Maps
                </a>
              )}
            </div>
          )}

          {contribuyenteNombre && (
            <div className="mis-reclamo-detail-section">
              <div className="mis-reclamos-drawer-section-label">Contribuyente</div>
              <div className="mis-reclamo-detail-row">
                <IconUser size={16} />
                <span>{contribuyenteNombre}</span>
              </div>
              {contribuyente?.numero_documento && (
                <div className="mis-reclamo-detail-meta">DNI: {contribuyente.numero_documento}</div>
              )}
              {contribuyente?.telefono_web && (
                <a href={`tel:${contribuyente.telefono_web}`} className="mis-reclamo-detail-phone">
                  <IconPhone size={15} />
                  {contribuyente.telefono_web}
                </a>
              )}
            </div>
          )}

          <div className="mis-reclamo-detail-grid">
            {reclamo.medio && (
              <div className="mis-reclamo-detail-grid-item">
                <span className="mis-reclamo-detail-grid-label">Medio</span>
                <span>{medioLabel[reclamo.medio] || reclamo.medio}</span>
              </div>
            )}
            {areaNombre && (
              <div className="mis-reclamo-detail-grid-item">
                <span className="mis-reclamo-detail-grid-label">Área</span>
                <span>{areaNombre}</span>
              </div>
            )}
            <div className="mis-reclamo-detail-grid-item">
              <span className="mis-reclamo-detail-grid-label">Alta</span>
              <span>{formatFechaLarga(reclamo.createdAt)}</span>
            </div>
            {reclamo.fechaCompromiso && (
              <div className="mis-reclamo-detail-grid-item">
                <span className="mis-reclamo-detail-grid-label">Compromiso</span>
                <span>
                  {new Date(reclamo.fechaCompromiso).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {reclamo.fechaResolucion && (
              <div className="mis-reclamo-detail-grid-item">
                <span className="mis-reclamo-detail-grid-label">Resuelto</span>
                <span>
                  {new Date(reclamo.fechaResolucion).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {reclamo.observaciones && (
            <div className="mis-reclamo-detail-obs">
              <strong>Observaciones internas:</strong> {reclamo.observaciones}
            </div>
          )}

          {reclamo.fotos && reclamo.fotos.length > 0 && (
            <div className="mis-reclamo-detail-section">
              <div className="mis-reclamos-drawer-section-label">Fotos adjuntas</div>
              <div className="mis-reclamo-detail-fotos">
                {reclamo.fotos.map((foto, idx) => {
                  if (typeof foto !== 'object') return null
                  const thumb = getMediaUrl(foto, 'thumbnail')
                  const full = getMediaUrl(foto, 'full')
                  if (!thumb || !full) return null
                  return (
                    <a key={foto.id || idx} href={full} target="_blank" rel="noopener noreferrer">
                      <img src={thumb} alt="Foto del reclamo" loading="lazy" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {reclamo.movimientos && reclamo.movimientos.length > 0 && (
            <div className="mis-reclamo-detail-section">
              <div className="mis-reclamos-drawer-section-label mis-reclamo-detail-section-label">
                <IconHistory size={16} />
                Historial
              </div>
              <div className="mis-reclamo-detail-timeline">
                {[...reclamo.movimientos].reverse().map((mov, idx) => (
                  <div key={mov.id || idx} className="mis-reclamo-detail-mov">
                    <div className="mis-reclamo-detail-mov-header">
                      <span className={`dash-badge ${estadoBadgeClass[mov.estado] || ''}`}>
                        {estadoLabel[mov.estado] || mov.estado}
                      </span>
                      <span className="mis-reclamo-detail-mov-fecha">
                        <IconClock size={13} />
                        {formatFechaLarga(mov.fecha)}
                      </span>
                    </div>
                    <p className="mis-reclamo-detail-mov-nota">{mov.nota}</p>
                    {mov.adjuntos && mov.adjuntos.length > 0 && (
                      <div className="mis-reclamo-detail-fotos mis-reclamo-detail-fotos--sm">
                        {mov.adjuntos.map((adj, adjIdx) => {
                          if (typeof adj !== 'object') return null
                          const thumb = getMediaUrl(adj, 'thumbnail')
                          const full = getMediaUrl(adj, 'full')
                          if (!thumb || !full) return null
                          return (
                            <a
                              key={adj.id || adjIdx}
                              href={full}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img src={thumb} alt="Adjunto" loading="lazy" />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    {mov.usuario && typeof mov.usuario === 'object' && (
                      <div className="mis-reclamo-detail-mov-user">
                        Por: {mov.usuario.nombre} {mov.usuario.apellido}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isTerminalEstado(reclamo.estado) && (
          <div className="mis-reclamos-drawer-footer">
            <button
              type="button"
              className="mis-reclamos-submit-btn"
              onClick={() => onActuar(reclamo)}
            >
              Actuar <IconArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
