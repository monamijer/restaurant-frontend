import { describe, it, expect } from 'vitest'
import { mountAt, USERS } from '../../helpers/app'
import AdminNav from '../../../src/components/admin/AdminNav.vue'

describe('AdminNav', () => {
  it('renders the admin links in English', async () => {
    const { wrapper } = await mountAt(AdminNav, '/admin', { user: USERS.admin })
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(7)
    expect(links[0].text()).toBe('Admin')
    expect(links[1].text()).toBe('Dashboard')
    expect(links[2].text()).toBe('Categories')
    expect(links[3].text()).toBe('Menu')
    expect(links[4].text()).toBe('Settings')
    expect(links[5].text()).toBe('Users')
    expect(links[6].text()).toBe('Reports')
  })

  it('marks the active route', async () => {
    const { wrapper } = await mountAt(AdminNav, '/admin/categories', { user: USERS.admin })
    const active = wrapper.findAll('a.is-active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Categories')
  })

  it('exposes an accessible label', async () => {
    const { wrapper } = await mountAt(AdminNav, '/admin', { user: USERS.admin })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Administration navigation')
  })
})
