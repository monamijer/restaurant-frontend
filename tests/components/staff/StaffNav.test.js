import { describe, it, expect } from 'vitest'
import { mountAt, USERS } from '../../helpers/app'
import StaffNav from '../../../src/components/staff/StaffNav.vue'

describe('StaffNav', () => {
  it('renders the staff links in English', async () => {
    const { wrapper } = await mountAt(StaffNav, '/staff', { user: USERS.staff })
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(7)
    expect(links[0].text()).toBe('Dashboard')
    expect(links[1].text()).toBe('Orders')
    expect(links[2].text()).toBe('New order')
    expect(links[3].text()).toBe('Reservations')
    expect(links[4].text()).toBe('Queue')
    expect(links[5].text()).toBe('Tables')
    expect(links[6].text()).toBe('Payments')
  })

  it('marks the active route', async () => {
    const { wrapper } = await mountAt(StaffNav, '/staff/orders', { user: USERS.staff })
    const active = wrapper.findAll('a.is-active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Orders')
  })

  it('exposes an accessible label', async () => {
    const { wrapper } = await mountAt(StaffNav, '/staff', { user: USERS.staff })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Staff area navigation')
  })
})
