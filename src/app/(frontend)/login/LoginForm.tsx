'use client'

import React, { useState, FormEvent } from 'react'
import { IconMail, IconLock, IconLogin2, IconAlertCircle } from '@tabler/icons-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Completá todos los campos')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.errors?.[0]?.message || 'Credenciales incorrectas. Verificá tu email y contraseña.',
        )
      }

      // Successful login — redirect based on role
      const userRole = data?.user?.role
      if (userRole === 'ejecutor') {
        window.location.href = '/mis-reclamos' // Placeholder for the field worker's view
      } else {
        // Admin, Carga, and Visualizador go to the main dashboard
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Decorative background shapes */}
      <div className="login-bg-shape login-bg-shape--1" />
      <div className="login-bg-shape login-bg-shape--2" />
      <div className="login-bg-shape login-bg-shape--3" />

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-ring">
            <IconLock size={32} stroke={1.8} />
          </div>
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-subtitle">Centro de Atención al Vecino</p>
        </div>

        {/* Error alert */}
        {error && (
          <div role="alert" className="alert alert-error login-alert">
            <IconAlertCircle size={20} stroke={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <fieldset disabled={loading} className="login-fieldset">
            {/* Email */}
            <label className="login-field">
              <span className="login-field-label">Email</span>
              <div className="login-input-wrap">
                <IconMail size={18} stroke={1.6} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="input input-bordered w-full login-input"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            {/* Password */}
            <label className="login-field">
              <span className="login-field-label">Contraseña</span>
              <div className="login-input-wrap">
                <IconLock size={18} stroke={1.6} className="login-input-icon" />
                <input
                  id="login-password"
                  type="password"
                  className="input input-bordered w-full login-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className={`btn btn-primary w-full login-btn ${loading ? 'btn-disabled' : ''}`}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <IconLogin2 size={20} stroke={2} />
                  Ingresar
                </>
              )}
            </button>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <a href="/" className="login-back-link">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
