'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  IconSearch,
  IconMapPin,
  IconCamera,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconLocation,
  IconArrowLeft,
  IconSend,
  IconClock,
} from '@tabler/icons-react'

interface User {
  id: string
  nombre: string
  apellido: string
  role: string
  area?: string | { id: string; nombre: string }
}

interface Coordenadas {
  lat: number
  lng: number
}

interface Reclamo {
  id: string
  numero: number
  tipo: string
  estado: string
  prioridad: string
  calle: string
  descripcion: string
  createdAt: string
  coordenadas?: Coordenadas
  movimientos?: any[]
  fotos?: any[]
}

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

const estadoBadge: Record<string, string> = {
  pendiente: 'bg-[#fbd300]/20 text-[#fbd300] border border-[#fbd300]/30',
  en_proceso: 'bg-[#7bcbe2]/20 text-[#7bcbe2] border border-[#7bcbe2]/30',
  resuelto: 'bg-[#b6c544]/20 text-[#b6c544] border border-[#b6c544]/30',
  rechazado: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30',
}

export default function MisReclamosClient() {
  const [user, setUser] = useState<User | null>(null)
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [userCoords, setUserCoords] = useState<Coordenadas | null>(null)

  // Resolución Modal
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)
  const [resolving, setResolving] = useState(false)
  const [formEstado, setFormEstado] = useState('resuelto')
  const [formNota, setFormNota] = useState('')
  const [formFoto, setFormFoto] = useState<File | null>(null)
  const [formCoords, setFormCoords] = useState<Coordenadas | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUserAndReclamos()
  }, [])

  const fetchUserAndReclamos = async () => {
    try {
      setLoading(true)
      const userRes = await fetch('/api/users/me', { credentials: 'include' })
      const userData = await userRes.json()
      
      if (!userData?.user) {
        setError('No estás autenticado.')
        return
      }
      
      const loggedUser = userData.user
      setUser(loggedUser)

      if (loggedUser.role !== 'ejecutor' && loggedUser.role !== 'admin') {
        setError('No tienes permisos para esta sección.')
        return
      }

      if (!loggedUser.area) {
        setError('No tienes un área asignada para ver reclamos.')
        return
      }

      const areaId = typeof loggedUser.area === 'object' ? loggedUser.area.id : loggedUser.area

      const reclamosRes = await fetch(`/api/reclamos?where[area_derivada][equals]=${areaId}&sort=createdAt&limit=0`, {
        credentials: 'include'
      })
      const reclamosData = await reclamosRes.json()
      
      if (reclamosData.docs) {
        setReclamos(reclamosData.docs)
      }
    } catch (err) {
      console.error(err)
      setError('Error al cargar la información.')
    } finally {
      setLoading(false)
    }
  }

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  }

  const handleSortByProximity = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es soportada por tu navegador.")
      return
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
    }, (err) => {
      console.error(err)
      alert("No se pudo obtener tu ubicación. Verifica los permisos.")
    })
  }

  const captureResolutionLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((position) => {
      setFormCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormFoto(e.target.files[0])
    }
  }

  const openResolution = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo)
    setFormEstado('resuelto')
    setFormNota('')
    setFormFoto(null)
    setFormCoords(null)
  }

  const closeResolution = () => {
    setSelectedReclamo(null)
  }

  const submitResolution = async () => {
    if (!selectedReclamo || !user) return

    if (formEstado !== 'resuelto' && !formNota.trim()) {
      alert('Debes ingresar una nota o explicación si el reclamo no fue resuelto.')
      return
    }

    try {
      setResolving(true)

      let fotoId = null
      if (formFoto) {
        const formData = new FormData()
        formData.append('file', formFoto)
        formData.append('alt', `Resolución #${selectedReclamo.numero}`)

        const uploadRes = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.doc && uploadData.doc.id) {
          fotoId = uploadData.doc.id
        }
      }

      let notaFinal = formNota.trim()
      if (formCoords) {
        notaFinal = `[GPS: ${formCoords.lat.toFixed(5)}, ${formCoords.lng.toFixed(5)}]\n${notaFinal}`
      }

      const nuevoMovimiento = {
        estado: formEstado,
        nota: notaFinal || 'Atención completada en sitio.',
        fecha: new Date().toISOString(),
        usuario: user.id
      }

      const fotosCargadas = selectedReclamo.fotos ? selectedReclamo.fotos.map((f: any) => f.id || f) : []
      if (fotoId) fotosCargadas.push(fotoId)

      const patchRes = await fetch(`/api/reclamos/${selectedReclamo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: formEstado,
          movimientos: [...(selectedReclamo.movimientos || []), nuevoMovimiento],
          fotos: fotosCargadas
        }),
      })

      if (patchRes.ok) {
        setReclamos(prev => prev.map(r => {
          if (r.id === selectedReclamo.id) {
            return {
              ...r,
              estado: formEstado,
              movimientos: [...(r.movimientos || []), nuevoMovimiento],
              fotos: fotosCargadas
            }
          }
          return r
        }))
        closeResolution()
      } else {
        alert("Hubo un error al actualizar.")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión.")
    } finally {
      setResolving(false)
    }
  }

  let displayedReclamos = [...reclamos]
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    displayedReclamos = displayedReclamos.filter(r => 
      (r.calle || '').toLowerCase().includes(term) ||
      r.numero.toString().includes(term) ||
      (r.descripcion || '').toLowerCase().includes(term)
    )
  }

  if (userCoords) {
    displayedReclamos.sort((a, b) => {
      if (!a.coordenadas?.lat || !b.coordenadas?.lat) return 0
      const distA = getDistanceFromLatLonInKm(userCoords.lat, userCoords.lng, a.coordenadas.lat, a.coordenadas.lng)
      const distB = getDistanceFromLatLonInKm(userCoords.lat, userCoords.lng, b.coordenadas.lat, b.coordenadas.lng)
      return distA - distB
    })
  }

  if (loading) {
    return (
      <div className="dash-layout items-center justify-center">
        <span className="loading loading-spinner text-[#b6c544] w-12 h-12"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dash-layout items-center justify-center p-6 text-center">
        <IconAlertTriangle size={64} className="text-[#ff6b6b] mb-6 opacity-80" />
        <h2 className="text-2xl font-bold mb-4 text-white/90 font-['Outfit']">{error}</h2>
        <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#b6c544] text-[#0a150a] font-semibold hover:bg-[#c4d54b] transition-all">
          Volver al Menú
        </Link>
      </div>
    )
  }

  return (
    <div className="dash-layout flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <div className="flex-none bg-black/40 backdrop-blur-xl border-b border-white/5 pt-6 pb-4 px-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <IconArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] tracking-tight flex-1">
            Mis Tareas
          </h1>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar reclamo..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#b6c544]/50 focus:bg-white/10 transition-all text-[15px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              userCoords 
                ? 'bg-[#b6c544]/20 border-[#b6c544]/40 text-[#b6c544]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            onClick={handleSortByProximity}
          >
            <IconMapPin size={22} />
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
        <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4 ml-1">
          {displayedReclamos.length} {displayedReclamos.length === 1 ? 'Actividad' : 'Actividades'} 
          {userCoords && ' • Por cercanía'}
        </p>

        {displayedReclamos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <IconCircleCheck size={64} className="mb-4" />
            <p className="text-lg font-['Outfit']">Todo al día</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedReclamos.map(reclamo => (
              <div key={reclamo.id} className="relative p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all hover:bg-white/10">
                {/* Glow sutil según estado */}
                {reclamo.estado === 'pendiente' && <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbd300]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>}
                {reclamo.estado === 'resuelto' && <div className="absolute top-0 right-0 w-32 h-32 bg-[#b6c544]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                      #{reclamo.numero}
                    </span>
                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${estadoBadge[reclamo.estado] || 'bg-white/10 text-white/60'}`}>
                      {estadoLabel[reclamo.estado] || reclamo.estado}
                    </div>
                  </div>

                  <h3 className="font-['Outfit'] font-semibold text-lg text-white/90 leading-tight mb-2 capitalize">
                    {reclamo.tipo}
                  </h3>

                  <div className="flex items-start gap-2 text-sm text-white/60 mb-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <IconLocation size={16} className="shrink-0 mt-0.5 opacity-70" />
                    <span className="leading-snug">{reclamo.calle || 'Sin dirección específica'}</span>
                  </div>

                  <p className="text-[14px] text-white/50 line-clamp-2 leading-relaxed mb-4">
                    {reclamo.descripcion}
                  </p>

                  <button 
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/90 font-medium hover:bg-[#b6c544] hover:border-[#b6c544] hover:text-[#0a150a] transition-all flex items-center justify-center gap-2"
                    onClick={() => openResolution(reclamo)}
                  >
                    Actuar <IconArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL / DRAWER */}
      {selectedReclamo && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeResolution}></div>
          
          <div className="relative bg-[#0d1a0f] border-t border-white/10 rounded-t-[32px] w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-up">
            <div className="flex-none p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white font-['Outfit']">Ticket #{selectedReclamo.numero}</h2>
              <button className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors" onClick={closeResolution}>
                <IconX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Opción de Estado */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Acción</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center p-4 rounded-xl cursor-pointer border transition-all ${formEstado === 'resuelto' ? 'bg-[#b6c544]/10 border-[#b6c544]/30 text-[#b6c544]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                    <input type="radio" name="estado" className="hidden" value="resuelto" checked={formEstado === 'resuelto'} onChange={() => setFormEstado('resuelto')} />
                    <IconCircleCheck size={20} className="mr-3 shrink-0" />
                    <span className="font-medium">Completado Extitosamente</span>
                  </label>
                  <label className={`flex items-center p-4 rounded-xl cursor-pointer border transition-all ${formEstado === 'en_proceso' ? 'bg-[#7bcbe2]/10 border-[#7bcbe2]/30 text-[#7bcbe2]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                    <input type="radio" name="estado" className="hidden" value="en_proceso" checked={formEstado === 'en_proceso'} onChange={() => setFormEstado('en_proceso')} />
                    <IconClock size={20} className="mr-3 shrink-0" />
                    <span className="font-medium">Continuar Luego / Falta material</span>
                  </label>
                </div>
              </div>

              {/* Adjuntos */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Evidencia</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  
                  <button 
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${formFoto ? 'bg-[#b6c544]/20 border-[#b6c544]/40 text-[#b6c544]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formFoto ? <IconCheck size={24} /> : <IconCamera size={24} />}
                    <span className="text-[13px] font-medium text-center leading-tight">
                      {formFoto ? 'Foto Cargada' : 'Tomar Foto'}
                    </span>
                  </button>

                  <button 
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 ${formCoords ? 'bg-[#b6c544]/20 border-[#b6c544]/40 text-[#b6c544]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    onClick={captureResolutionLocation}
                  >
                    {formCoords ? <IconCheck size={24} /> : <IconMapPin size={24} />}
                    <span className="text-[13px] font-medium text-center leading-tight">
                      {formCoords ? 'GPS Guardado' : 'Fijar GPS'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Detalle */}
              <div className="space-y-3 pb-8">
                <label className="text-sm font-semibold text-white/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Nota Final</span>
                  {formEstado !== 'resuelto' && <span className="text-[#ff6b6b] text-[10px] bg-[#ff6b6b]/10 px-2 py-0.5 rounded-sm">Obligatorio</span>}
                </label>
                <textarea 
                  className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#b6c544]/50 transition-all resize-none text-[15px] leading-relaxed"
                  placeholder="Detalles del trabajo u observaciones..."
                  value={formNota}
                  onChange={(e) => setFormNota(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="flex-none p-6 pt-0">
              <button 
                className="w-full py-4 rounded-xl bg-[#b6c544] text-[#0a150a] font-['Outfit'] font-bold text-lg hover:bg-[#c4d44b] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(182,197,68,0.2)]"
                onClick={submitResolution}
                disabled={resolving || (formEstado !== 'resuelto' && formNota.trim() === '')}
              >
                {resolving ? (
                  <span className="loading loading-spinner w-6 h-6"></span>
                ) : (
                  <>Registrar <IconSend size={20} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind anim for modal */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  )
}
