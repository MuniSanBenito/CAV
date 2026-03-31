'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { IconSearch, IconMapPin, IconLoader2 } from '@tabler/icons-react'

interface GeocodeResult {
  placeId: number
  displayName: string
  lat: number
  lng: number
  address: {
    street: string
    houseNumber: string
    suburb: string
    city: string
  }
}

interface AddressSearchProps {
  onSelect: (result: GeocodeResult) => void
  placeholder?: string
  className?: string
  value?: string // Valor externo (ej: reverse geocode desde el mapa)
}

export default function AddressSearch({
  onSelect,
  placeholder = 'Buscar dirección...',
  className = '',
  value,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar cuando el valor externo cambia (ej: reverse geocode del mapa)
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value)
      setShowResults(false)
    }
  }, [value])

  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error buscando dirección:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      searchAddress(value)
    }, 400)
  }

  const handleSelect = (result: GeocodeResult) => {
    setQuery(result.displayName)
    setShowResults(false)
    onSelect(result)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {loading && (
          <IconLoader2
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((result) => (
            <button
              key={result.placeId}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
            >
              <IconMapPin size={16} className="mt-0.5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.address.street} {result.address.houseNumber}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {result.address.suburb && `${result.address.suburb}, `}
                  {result.address.city}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
