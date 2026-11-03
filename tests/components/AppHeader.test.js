import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AppHeader from '@/components/layout/AppHeader.vue'
import { authService } from '@/services/authService'
import { useToastStore } from '@/store/toasts'
import { mountAt, USERS } from '../helpers/app'

const links = (wrapper) => wrapper.findAll('.header__link').map((link) => link.text())

describe('AppHeader', () => {
  it('invites a visitor to sign in or register', async () => {
    const { wrapper } = await mountAt(AppHeader, '/')

    expect(links(wrapper)).toEqual(['Home', 'Menu'])
    const actions = wrapper.get('.header__actions').text()
    expect(actions).toContain('Sign in')
    expect(actions).toContain('Create account')
    expect(actions).not.toContain('Sign out')
  })

  it.each([
    ['client', ['Home', 'Menu', 'My orders', 'My account']],
    ['staff', ['Home', 'Menu', 'My orders', 'My account', 'Staff area']],
    ['admin', ['Home', 'Menu', 'My orders', 'My account', 'Staff area', 'Administration']],
  ])('shows a %s only the pages their role allows', async (role, expected) => {
    const { wrapper } = await mountAt(AppHeader, '/', { user: USERS[role] })

    expect(links(wrapper)).toEqual(expected)
  })

  it('says who is signed in and offers to sign out', async () => {
    const { wrapper } = await mountAt(AppHeader, '/', { user: USERS.client })

    expect(wrapper.get('.header__user').text()).toBe('Signed in as Ada Lovelace')
    expect(wrapper.get('.header__actions').text()).toContain('Sign out')
  })

  it('signs out, tells the user and returns to the home page', async () => {
    const logout = vi.spyOn(authService, 'logout').mockResolvedValue()
    const { wrapper, router, auth } = await mountAt(AppHeader, '/client/account', { user: USERS.client })

    const signOut = wrapper.findAll('button').find((button) => button.text() === 'Sign out')
    await signOut.trigger('click')
    await flushPromises()

    expect(logout).toHaveBeenCalledOnce()
    expect(auth.user).toBeNull()
    expect(router.currentRoute.value.name).toBe('home')
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['You have been signed out.'])
  })

  it('opens and closes the mobile menu with the right accessibility state', async () => {
    const { wrapper } = await mountAt(AppHeader, '/')
    const button = wrapper.get('.header__menu-button')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('site-menu')
    expect(button.attributes('aria-label')).toBe('Open menu')

    await button.trigger('click')

    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-label')).toBe('Close menu')
    expect(wrapper.get('#site-menu').classes()).toContain('header__panel--open')
  })

  it('closes the mobile menu when the visitor moves to another page', async () => {
    const { wrapper, router } = await mountAt(AppHeader, '/')
    await wrapper.get('.header__menu-button').trigger('click')

    await router.push('/login')
    await flushPromises()

    expect(wrapper.get('#site-menu').classes()).not.toContain('header__panel--open')
  })

  it('labels the navigation landmark', async () => {
    const { wrapper } = await mountAt(AppHeader, '/')

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Main navigation')
  })
})
