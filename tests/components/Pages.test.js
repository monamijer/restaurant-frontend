import { describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/authService'
import { useRestaurantStore } from '@/store/restaurant'
import AccountView from '@/views/AccountView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { mountAt, USERS } from '../helpers/app'

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
