import React from 'react'
import LoginForm from './LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión — CAV San Benito',
  description: 'Ingresá al Centro de Atención al Vecino de la Municipalidad de San Benito',
}

export default function LoginPage() {
  return <LoginForm />
}
