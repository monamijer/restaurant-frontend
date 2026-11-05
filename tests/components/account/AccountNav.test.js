import { describe, it, expect } from 'vitest'
import { mountAt, USERS } from '../../helpers/app'
import AccountNav from '../../../src/components/account/AccountNav.vue'

describe('AccountNav', () => {
  it('renders the three account links', async () => {
    const { wrapper } = await mountAt(AccountNav, '/client/account', { user: USERS.client })
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(3)
    expect(links[0].text()).toBe('Summary')
    expect(links[1].text()).toBe('Profile')
    expect(links[2].text()).toBe('Password')
  })

  it('marks the active route', async () => {
    const { wrapper } = await mountAt(AccountNav, '/account/profile', { user: USERS.client })
    const active = wrapper.findAll('a.is-active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Profile')
  })

  it('exposes an accessible label', async () => {
    const { wrapper } = await mountAt(AccountNav, '/client/account', { user: USERS.client })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Account navigation')
  })
})
