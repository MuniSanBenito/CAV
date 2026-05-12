'use client'

import { IconAlertCircle, IconId, IconLock, IconLogin2 } from '@tabler/icons-react'
import { SubmitEvent, useState } from 'react'

export default function LoginForm() {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!dni || !password) {
      setError('Completá todos los campos')
      return
    }

    setLoading(true)

    try {
      /* const response = await sdk.login({
        collection: 'users',
        data: {
          username: dni,
          password: password,
        },
      }) */

      const res = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: dni,
          password: password,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          errorData?.errors?.[0]?.message ||
            'Credenciales incorrectas. Verificá tu DNI y contraseña.',
        )
      }
      const data = await res.json()

      if (!data.user) {
        throw new Error('Credenciales incorrectas. Verificá tu DNI y contraseña.')
      }

      // Successful login — redirect based on role
      const userRole = data.user.role
      if (userRole === 'ejecutor') {
        window.location.href = '/mis-reclamos' // Placeholder for the field worker's view
      } else {
        // Admin, Carga, and Visualizador go to the main dashboard
        window.location.href = '/dashboard'
      }

      /* const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dni, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.errors?.[0]?.message || 'Credenciales incorrectas. Verificá tu DNI y contraseña.',
        )
      }

      // Successful login — redirect based on role
      const userRole = data?.user?.role
      if (userRole === 'ejecutor') {
        window.location.href = '/mis-reclamos' // Placeholder for the field worker's view
      } else {
        // Admin, Carga, and Visualizador go to the main dashboard
        window.location.href = '/dashboard'
      } */
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
            {/* DNI */}
            <label className="login-field">
              <span className="login-field-label">DNI</span>
              <div className="login-input-wrap">
                <IconId size={18} stroke={1.6} className="login-input-icon" />
                <input
                  id="login-dni"
                  type="text"
                  inputMode="numeric"
                  className="input input-bordered w-full login-input"
                  placeholder="12345678"
                  autoComplete="username"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
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
