import { describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/authService'
import { settingsService } from '@/services/settingsService'
import { useRestaurantStore } from '@/store/restaurant'
import AccountView from '@/views/AccountView.vue'
import HomeView from '@/views/HomeView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { mountAt, USERS } from '../helpers/app'

describe('HomeView', () => {
  it('invites a visitor to sign in or register', async () => {
    const { wrapper } = await mountAt(HomeView, '/')

    expect(wrapper.get('h1').text()).toBe('Welcome to Restaurant')
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual(['/login', '/register'])
  })

  it.each([
    ['client', '/client/account'],
    ['staff', '/staff'],
    ['admin', '/admin'],
  ])('sends a signed-in %s to their area', async (role, href) => {
    const { wrapper } = await mountAt(HomeView, '/', { user: USERS[role] })

    expect(wrapper.get('a').attributes('href')).toBe(href)
    expect(wrapper.get('a').text()).toBe('Go to my area')
  })

  it('shows the name and opening hours read from the backend', async () => {
    const { wrapper } = await mountAt(HomeView, '/')

    const restaurant = useRestaurantStore()
    restaurant.settings = { name: 'Chez Test', opening_time: '09:00:00', closing_time: '22:00:00' }
    await wrapper.vm.$nextTick()

    expect(wrapper.get('h1').text()).toBe('Welcome to Chez Test')
    expect(wrapper.text()).toContain('Every day, 09:00 to 22:00')
  })

  it('explains an unreachable server and lets the visitor retry', async () => {
    const get = vi.spyOn(settingsService, 'get').mockRejectedValue(new Error('offline'))
    const { wrapper } = await mountAt(HomeView, '/')
    useRestaurantStore().failed = true
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain("The restaurant's server cannot be reached.")

    await wrapper.findAll('button').find((button) => button.text() === 'Try again').trigger('click')

    expect(get).toHaveBeenCalledOnce()
  })
})

describe('AppFooter', () => {
  it('shows the opening hours when they are known, and says so when they are not', async () => {
    const { wrapper } = await mountAt(AppFooter, '/')
    expect(wrapper.text()).toContain('Opening hours are not available right now.')

    useRestaurantStore().settings = { name: 'Chez Test', opening_time: '10:00:00', closing_time: '23:30:00' }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Every day, 10:00 to 23:30')
    expect(wrapper.text()).toContain('Chez Test')
  })
})

describe('AccountView', () => {
  it('shows the details of the signed-in user and refreshes them from the server', async () => {
    const me = vi.spyOn(authService, 'me').mockResolvedValue({ ...USERS.staff, first_name: 'Samuel' })
    const { wrapper } = await mountAt(AccountView, '/client/account', { user: USERS.staff })

    expect(me).toHaveBeenCalledOnce()
    expect(wrapper.get('h1').text()).toBe('Hello, Samuel')
    expect(wrapper.text()).toContain('sam@example.com')
    expect(wrapper.text()).toContain('+25779000002')
    expect(wrapper.text()).toContain('Staff')
  })

  it('says when no phone number was given and keeps working if the refresh fails', async () => {
    vi.spyOn(authService, 'me').mockRejectedValue(new Error('offline'))
    const { wrapper } = await mountAt(AccountView, '/client/account', { user: USERS.client })

    expect(wrapper.text()).toContain('Not provided')
    expect(wrapper.get('h1').text()).toBe('Hello, Ada')
  })
})

describe('error pages', () => {
  it('explain a refused page and lead back home', async () => {
    const { wrapper } = await mountAt(ForbiddenView, '/forbidden')

    expect(wrapper.text()).toContain('Access denied')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })

  it('explain a missing page and lead back home', async () => {
    const { wrapper } = await mountAt(NotFoundView, '/missing')

    expect(wrapper.text()).toContain('Page not found')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })
})
