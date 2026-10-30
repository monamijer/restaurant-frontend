import { useAuthStore } from '@/store/auth'
import { homeRouteFor } from '@/utils/roles'

/**
 * Runs before every navigation. It improves the experience (no flash of a page the visitor
 * cannot use) but is not security: every request is checked again by the backend.
 */
export async function authGuard(to) {
  const auth = useAuthStore()
  await auth.restoreSession() // Re-opens a session that survived a page reload, once.

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: homeRouteFor(auth.role) }
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'forbidden' }
  }
  return true
}
