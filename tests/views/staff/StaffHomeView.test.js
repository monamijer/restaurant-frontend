import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffHomeView from '../../../src/views/staff/StaffHomeView.vue'
import dashboardService from '../../../src/services/dashboardService'

const STATS = {
  today: {
    tables: { occupied: 3, total: 10 },
    queue: { waiting: 5, estimated_wait_minutes: 20 },
    orders: { total: 42, open: 4 },
    payments: { total: '1234.50', pending: 2 },
  },
}

describe('StaffHomeView', () => {
  it('renders the counters from the dashboard', async () => {
    vi.spyOn(dashboardService, 'stats').mockResolvedValue(STATS)
    const { wrapper } = await mountAt(StaffHomeView, '/staff', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Tables occupied')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('$1,234.50')
  })

  it('shows a retry when the dashboard fails', async () => {
    vi.spyOn(dashboardService, 'stats').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffHomeView, '/staff', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the dashboard.')
    const buttons = wrapper.findAll('button').filter((b) => b.text() === 'Try again')
    expect(buttons).toHaveLength(1)
  })

  it('exposes shortcuts to the order board and a walk-in order', async () => {
    vi.spyOn(dashboardService, 'stats').mockResolvedValue(STATS)
    const { wrapper } = await mountAt(StaffHomeView, '/staff', { user: USERS.staff })
    await flushPromises()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/staff/orders')
    expect(hrefs).toContain('/staff/orders/new')
  })
})
