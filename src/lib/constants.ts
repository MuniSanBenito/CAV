// Shared constants for the CAV frontend
// Single source of truth — avoid duplicating these maps in components

export const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

export const estadoBadgeClass: Record<string, string> = {
  pendiente: 'dash-badge--pending',
  en_proceso: 'dash-badge--progress',
  resuelto: 'dash-badge--resolved',
  rechazado: 'dash-badge--rejected',
}

export const prioridadLabel: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const prioridadBadgeClass: Record<string, string> = {
  baja: 'dash-badge--low',
  media: 'dash-badge--medium',
  alta: 'dash-badge--high',
  urgente: 'dash-badge--urgent',
}

export const tipoLabel: Record<string, string> = {
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  denuncia: 'Denuncia',
  consulta: 'Consulta',
}

export const tipoBadgeClass: Record<string, string> = {
  reclamo: 'dash-badge--pending',
  sugerencia: 'dash-badge--progress',
  denuncia: 'dash-badge--rejected',
  consulta: 'dash-badge--low',
}

// SLA: estado de cumplimiento según fechaCompromiso
export type SlaStatus = 'vencido' | 'por_vencer' | 'en_plazo' | null

const POR_VENCER_MS = 48 * 60 * 60 * 1000 // 48hs antes del vencimiento

export function getSlaStatus(
  fechaCompromiso?: string | null,
  estado?: string | null,
): SlaStatus {
  if (!fechaCompromiso) return null
  if (estado === 'resuelto' || estado === 'rechazado') return null
  const due = new Date(fechaCompromiso).getTime()
  if (Number.isNaN(due)) return null
  const now = Date.now()
  if (now > due) return 'vencido'
  if (due - now <= POR_VENCER_MS) return 'por_vencer'
  return 'en_plazo'
}

export const slaLabel: Record<string, string> = {
  vencido: 'Vencido',
  por_vencer: 'Por vencer',
  en_plazo: 'En plazo',
}

export const slaBadgeClass: Record<string, string> = {
  vencido: 'dash-badge--urgent',
  por_vencer: 'dash-badge--high',
  en_plazo: 'dash-badge--resolved',
}

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  carga: 'Carga',
  ejecutor: 'Ejecutor',
  visualizador: 'Visualizador',
}

// Card glow classes for mis-reclamos
export const cardGlowClass: Record<string, string> = {
  pendiente: 'mis-reclamo-card-glow mis-reclamo-card-glow--pending',
  en_proceso: 'mis-reclamo-card-glow mis-reclamo-card-glow--en_proceso',
  resuelto: 'mis-reclamo-card-glow mis-reclamo-card-glow--resuelto',
}
