import { translate } from '@/i18n'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'

/**
 * What happens when the session cannot be renewed any more: forget it, say so, and send the
 * visitor to sign in again, bringing them back to this page afterwards. Public pages stay put.
 */
export function sessionExpiredHandler(router) {
  return () => {
    useAuthStore().expireSession()
    useToastStore().error(translate('auth.sessionExpired'))

    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  }
}
