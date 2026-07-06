'use client'

import type { ReclamoEjecutor } from '@/app/(frontend)/mis-reclamos/types'
import {
  cardGlowClass,
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
  IconCalendar,
  IconClock,
  IconHistory,
  IconLocation,
  IconNotes,
  IconPhone,
  IconUser,
} from '@tabler/icons-react'

interface Props {
  reclamo: ReclamoEjecutor
  onOpenDetail: (reclamo: ReclamoEjecutor) => void
  onActuar: (reclamo: ReclamoEjecutor) => void
}

function formatFechaCorta(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MisReclamoCard({ reclamo, onOpenDetail, onActuar }: Props) {
  const slaStatus = getSlaStatus(reclamo.fechaCompromiso, reclamo.estado)
  const conceptoNombre = getConceptoNombre(reclamo.concepto)
  const areaNombre = getAreaNombre(reclamo.area_derivada)
  const contribuyenteNombre = getContribuyenteNombre(reclamo.contribuyente)
  const contribuyente =
    reclamo.contribuyente && typeof reclamo.contribuyente === 'object'
      ? reclamo.contribuyente
      : null
  const coords = getReclamoCoords(reclamo)

  const ubicacionLinea = [
    reclamo.calle || reclamo.ubicacion?.direccionNormalizada,
    reclamo.ubicacion?.barrio,
    reclamo.ubicacion?.localidad,
  ]
    .filter(Boolean)
    .join(' · ')

  const ultimoMov =
    reclamo.movimientos && reclamo.movimientos.length > 0
      ? reclamo.movimientos[reclamo.movimientos.length - 1]
      : null

  const fotosObjetos = (reclamo.fotos || []).filter((f) => typeof f === 'object').slice(0, 3)

  const titulo = conceptoNombre || reclamo.descripcion
  const tipoMedio = [
    tipoLabel[reclamo.tipo] || reclamo.tipo,
    reclamo.medio ? medioLabel[reclamo.medio] || reclamo.medio : null,
    areaNombre,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="mis-reclamo-card mis-reclamo-card--clickable"
      onClick={() => onOpenDetail(reclamo)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail(reclamo)
        }
      }}
      role="button"
      tabIndex={0}
    >
      {cardGlowClass[reclamo.estado] && <div className={cardGlowClass[reclamo.estado]} />}

      <div className="mis-reclamo-card-body">
        <div className="mis-reclamo-card-toprow">
          <span className="mis-reclamo-card-numero">#{reclamo.numero}</span>
          <div className="mis-reclamo-card-badges">
            <span className={`dash-badge ${estadoBadgeClass[reclamo.estado] || ''}`}>
              {estadoLabel[reclamo.estado] || reclamo.estado}
            </span>
            <span className={`dash-badge ${prioridadBadgeClass[reclamo.prioridad] || ''}`}>
              {prioridadLabel[reclamo.prioridad] || reclamo.prioridad}
            </span>
            {slaStatus && (
              <span className={`dash-badge ${slaBadgeClass[slaStatus] || ''}`}>
                {slaLabel[slaStatus]}
              </span>
            )}
          </div>
        </div>

        <h3 className="mis-reclamo-card-titulo">{titulo}</h3>
        <p className="mis-reclamo-card-subtitulo">{tipoMedio}</p>

        {conceptoNombre && reclamo.descripcion && (
          <p className="mis-reclamo-card-desc">{reclamo.descripcion}</p>
        )}

        <div className="mis-reclamo-card-info">
          {contribuyenteNombre && (
            <div className="mis-reclamo-card-info-row">
              <IconUser size={15} className="mis-reclamo-card-info-icon" />
              <div className="mis-reclamo-card-info-content">
                <span className="mis-reclamo-card-info-label">Contribuyente</span>
                <span className="mis-reclamo-card-info-value">{contribuyenteNombre}</span>
                {contribuyente?.dni && (
                  <span className="mis-reclamo-card-info-extra">DNI {contribuyente.dni}</span>
                )}
                {contribuyente?.telefono && (
                  <a
                    href={`tel:${contribuyente.telefono}`}
                    className="mis-reclamo-card-phone"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconPhone size={13} />
                    {contribuyente.telefono}
                  </a>
                )}
              </div>
            </div>
          )}

          {ubicacionLinea && (
            <div className="mis-reclamo-card-info-row">
              <IconLocation size={15} className="mis-reclamo-card-info-icon" />
              <div className="mis-reclamo-card-info-content">
                <span className="mis-reclamo-card-info-label">Ubicación</span>
                <span className="mis-reclamo-card-info-value">{ubicacionLinea}</span>
                {coords && (
                  <a
                    href={getGoogleMapsUrl(coords.lat, coords.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mis-reclamo-card-maps-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Abrir en Maps
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mis-reclamo-card-dates">
            <div className="mis-reclamo-card-date-item">
              <IconClock size={14} />
              <span>
                Alta:{' '}
                {formatFechaCorta(reclamo.createdAt) || formatFechaRelativa(reclamo.createdAt)}
              </span>
            </div>
            {reclamo.fechaCompromiso && (
              <div className="mis-reclamo-card-date-item">
                <IconCalendar size={14} />
                <span>Compromiso: {formatFechaCorta(reclamo.fechaCompromiso)}</span>
              </div>
            )}
          </div>
        </div>

        {reclamo.observaciones && (
          <div className="mis-reclamo-card-obs">
            <IconNotes size={14} />
            <span>{reclamo.observaciones}</span>
          </div>
        )}

        {ultimoMov && (
          <div className="mis-reclamo-card-mov">
            <div className="mis-reclamo-card-mov-header">
              <IconHistory size={14} />
              <span>Último movimiento</span>
              <span className={`dash-badge ${estadoBadgeClass[ultimoMov.estado] || ''}`}>
                {estadoLabel[ultimoMov.estado] || ultimoMov.estado}
              </span>
            </div>
            <p className="mis-reclamo-card-mov-nota">{ultimoMov.nota}</p>
          </div>
        )}

        {fotosObjetos.length > 0 && (
          <div className="mis-reclamo-card-fotos">
            {fotosObjetos.map((foto, idx) => {
              const thumb = getMediaUrl(foto, 'thumbnail')
              if (!thumb) return null
              return (
                <img
                  key={foto.id || idx}
                  src={thumb}
                  alt="Foto adjunta"
                  loading="lazy"
                  className="mis-reclamo-card-foto-thumb"
                />
              )
            })}
            {(reclamo.fotos?.length || 0) > 3 && (
              <span className="mis-reclamo-card-fotos-more">
                +{(reclamo.fotos?.length || 0) - 3}
              </span>
            )}
          </div>
        )}

        <div className="mis-reclamo-card-footer">
          <span className="mis-reclamo-card-ver-mas">Tocar para ver detalle completo</span>
          {!isTerminalEstado(reclamo.estado) && (
            <button
              type="button"
              className="mis-reclamo-card-action-btn"
              onClick={(e) => {
                e.stopPropagation()
                onActuar(reclamo)
              }}
            >
              Actuar <IconArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
