import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../helpers/app'
import AppHeader from '../../src/components/layout/AppHeader.vue'
import { useRestaurantStore } from '../../src/store/restaurant'

describe('AppHeader', () => {
  it('shows the restaurant name and the public navigation', async () => {
    const { wrapper } = await mountAt(AppHeader, '/', { before: () => {
      useRestaurantStore().settings = { name: 'Maisha' }
    } })
    expect(wrapper.text()).toContain('Maisha')
    const navLinks = wrapper.findAll('.header__nav-link').map((a) => a.text())
    expect(navLinks).toContain('Home')
    expect(navLinks).toContain('Menu')
    expect(navLinks).toContain('Queue')
  })

  it('pushes the search to the menu with the q query', async () => {
    const { wrapper, router } = await mountAt(AppHeader, '/')
    const input = wrapper.find('input[type="search"]')
    await input.setValue('pasta')
    await wrapper.find('form[role="search"]').trigger('submit.prevent')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('menu'))
    expect(router.currentRoute.value.query).toEqual({ q: 'pasta' })
  })

  it('opens the drawer and shows the full navigation there', async () => {
    const { wrapper } = await mountAt(AppHeader, '/', { user: USERS.staff })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    await wrapper.find('.header__menu-button').trigger('click')
    await flushPromises()
    const drawer = document.querySelector('[role="dialog"]')
    expect(drawer).not.toBeNull()
    const hrefs = Array.from(drawer.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/staff')
    expect(hrefs).toContain('/menu')
    expect(hrefs).toContain('/reservations')
  })

  it('does not show the staff link to a client', async () => {
    const { wrapper } = await mountAt(AppHeader, '/', { user: USERS.client })
    await wrapper.find('.header__menu-button').trigger('click')
    await flushPromises()
    const drawer = document.querySelector('[role="dialog"]')
    const hrefs = Array.from(drawer.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs).not.toContain('/staff')
    expect(hrefs).not.toContain('/admin')
  })

  it('shows a sign-in action to a visitor and a sign-out action to a signed-in user', async () => {
    const { wrapper: anonymous } = await mountAt(AppHeader, '/')
    expect(anonymous.findAll('a').some((a) => a.text() === 'Sign in')).toBe(true)

    const { wrapper: signedIn } = await mountAt(AppHeader, '/', { user: USERS.client })
    await signedIn.find('.header__menu-button').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Sign out')
  })
})
