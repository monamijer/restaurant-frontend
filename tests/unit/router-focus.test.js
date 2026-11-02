import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/store/auth'

function page() {
  document.body.innerHTML = '<main id="main" tabindex="-1"></main><input id="search" />'
  setActivePinia(createPinia())
  useAuthStore().restored = true
  return createAppRouter(createMemoryHistory())
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('focus after navigation', () => {
  it('moves to the main content when the page changes', async () => {
    const router = page()
    await router.push('/')
    await router.push('/menu')
    await nextTick()

    expect(document.activeElement).toBe(document.getElementById('main'))
  })

  it('stays where it is when only the query changes, so typing in a filter is not interrupted', async () => {
    const router = page()
    await router.push('/menu')
    document.getElementById('search').focus()

    await router.replace({ name: 'menu', query: { q: 'fish' } })
    await nextTick()

    expect(document.activeElement).toBe(document.getElementById('search'))
  })

  it('does not steal the focus on the very first load', async () => {
    const router = page()
    document.getElementById('search').focus()

    await router.push('/menu')
    await nextTick()

    expect(document.activeElement).toBe(document.getElementById('search'))
  })
})
