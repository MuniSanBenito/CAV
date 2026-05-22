import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = async ({ req: { user } }) => {
  return user?.role === 'admin'
}

export const isAdminFieldLevel: FieldAccess = async ({ req: { user } }) => {
  return user?.role === 'admin'
}

export const isAdminOrSelf: Access = async ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

export const authenticated: Access = async ({ req: { user } }) => {
  return Boolean(user)
}

export const anyone: Access = () => true
