'use client'

import React, { useRef, useState, useEffect } from 'react'
import { IconCamera, IconPhoto, IconX, IconLoader2 } from '@tabler/icons-react'

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8
const MAX_FILES = 6
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface FotoItem {
  file: File
  previewUrl: string
  originalSize: number
}

interface FotoUploaderProps {
  fotos: FotoItem[]
  onChange: (fotos: FotoItem[]) => void
  maxFiles?: number
  disabled?: boolean
}

/**
 * Comprime una imagen client-side usando canvas nativo:
 * resize a máx 1920px en el lado mayor + recompresión JPEG calidad 0.8.
 * GIFs se dejan intactos (canvas perdería la animación).
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap

    let targetWidth = width
    let targetHeight = height
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height)
      targetWidth = Math.round(width * scale)
      targetHeight = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) return file

    // Si la compresión no redujo el tamaño, usar el original
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    // Si algo falla (formato raro, etc.), subir el original
    return file
  }
}

/**
 * Sube las fotos a /api/media y devuelve los IDs creados.
 * Lanza error si alguna subida falla.
 */
export async function uploadFotos(fotos: FotoItem[], altPrefix: string): Promise<string[]> {
  const ids: string[] = []
  for (const foto of fotos) {
    const fd = new FormData()
    fd.append('file', foto.file)
    fd.append('_payload', JSON.stringify({ alt: `${altPrefix} — ${foto.file.name}` }))
    const res = await fetch('/api/media', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(
        data?.errors?.[0]?.message || `Error al subir la foto "${foto.file.name}".`,
      )
    }
    const data = await res.json()
    if (!data.doc?.id) {
      throw new Error(`No se pudo subir la foto "${foto.file.name}".`)
    }
    ids.push(data.doc.id)
  }
  return ids
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FotoUploader({
  fotos,
  onChange,
  maxFiles = MAX_FILES,
  disabled = false,
}: FotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Cleanup de object URLs al desmontar
  useEffect(() => {
    return () => {
      fotos.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError('')

    const files = Array.from(fileList)
    const invalid = files.find((f) => !ACCEPTED_TYPES.includes(f.type))
    if (invalid) {
      setError(`"${invalid.name}" no es una imagen válida (JPG, PNG, WebP o GIF).`)
      return
    }

    const remaining = maxFiles - fotos.length
    if (files.length > remaining) {
      setError(`Máximo ${maxFiles} fotos por reclamo.`)
      return
    }

    setProcessing(true)
    try {
      const nuevos: FotoItem[] = []
      for (const file of files) {
        const compressed = await compressImage(file)
        nuevos.push({
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          originalSize: file.size,
        })
      }
      onChange([...fotos, ...nuevos])
    } catch {
      setError('Error al procesar las imágenes.')
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  function removeFoto(index: number) {
    const foto = fotos[index]
    URL.revokeObjectURL(foto.previewUrl)
    onChange(fotos.filter((_, i) => i !== index))
  }

  return (
    <div className="foto-uploader">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || processing}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || processing}
      />

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="dash-action-btn dash-action-btn--secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || processing || fotos.length >= maxFiles}
        >
          {processing ? (
            <IconLoader2 size={18} className="animate-spin" />
          ) : (
            <IconPhoto size={18} />
          )}
          Elegir fotos
        </button>
        <button
          type="button"
          className="dash-action-btn dash-action-btn--secondary sm:hidden"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled || processing || fotos.length >= maxFiles}
        >
          <IconCamera size={18} />
          Tomar foto
        </button>
        <span className="text-xs text-gray-500 self-center">
          {fotos.length}/{maxFiles} · JPG, PNG, WebP o GIF
        </span>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
          {fotos.map((foto, i) => (
            <div key={foto.previewUrl} className="relative group rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.previewUrl}
                alt={foto.file.name}
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                aria-label={`Quitar ${foto.file.name}`}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                onClick={() => removeFoto(i)}
                disabled={disabled}
              >
                <IconX size={14} />
              </button>
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                {formatSize(foto.file.size)}
                {foto.originalSize > foto.file.size && (
                  <> · antes {formatSize(foto.originalSize)}</>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
