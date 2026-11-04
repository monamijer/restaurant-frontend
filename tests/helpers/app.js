import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { applyLocale, i18n } from '@/i18n'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/store/auth'

// Every component mounted here is unmounted when its test ends. A component left alive would
// keep reacting to late answers and, each time it re-rendered, make its own Pinia the active
// one, so a later test reading the stores would look at the wrong instance.
const mounted = []

afterEach(() => {
  for (const wrapper of mounted.splice(0)) {
    if (!wrapper.__unmounted) wrapper.unmount()
  }
})

/**
 * Mount a component inside the real router, stores and translations, as `user` (or signed out).
 * `before` runs once the stores exist and before the component is created, to prepare their state.
 */
export async function mountAt(component, path = '/', { user = null, props = {}, before } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyLocale('en')
  const auth = useAuthStore()
  auth.user = user
  auth.restored = true
  before?.()

  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()

  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: { plugins: [pinia, i18n, router] },
  })
  const unmount = wrapper.unmount.bind(wrapper)
  wrapper.unmount = () => {
    wrapper.__unmounted = true
    unmount()
  }
  mounted.push(wrapper)

  await flushPromises()
  return { wrapper, router, auth }
}

export const USERS = {
  client: { id: 1, email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', phone: '', role: 'client', created_at: '2026-09-01T10:00:00Z' },
  staff: { id: 2, email: 'sam@example.com', first_name: 'Sam', last_name: 'Waiter', phone: '+25779000002', role: 'staff', created_at: '2026-09-01T10:00:00Z' },
  admin: { id: 3, email: 'amy@example.com', first_name: 'Amy', last_name: 'Boss', phone: '', role: 'admin', created_at: '2026-09-01T10:00:00Z' },
}
