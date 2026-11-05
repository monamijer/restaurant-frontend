import { describe, it, expect, vi } from 'vitest'
import { mountAt, USERS } from '../helpers/app'
import StaffHomeView from '../../src/views/staff/StaffHomeView.vue'
import dashboardService from '../../src/services/dashboardService'
import staffOrderService from '../../src/services/staffOrderService'

function stub() {
  vi.spyOn(dashboardService, 'stats').mockResolvedValue({ today: {} })
  vi.spyOn(staffOrderService, 'list').mockResolvedValue({ count: 0, next: null, previous: null, results: [] })
}

describe('staff routes', () => {
  it('opens the staff home for staff and admin', async () => {
    stub()
    for (const user of [USERS.staff, USERS.admin]) {
      const { router } = await mountAt(StaffHomeView, '/staff', { user })
      expect(router.currentRoute.value.name).toBe('staff-home')
    }
  })

  it('redirects a client away from the staff area', async () => {
    stub()
    const { router } = await mountAt(StaffHomeView, '/staff', { user: USERS.client })
    expect(router.currentRoute.value.name).toBe('forbidden')
  })

  it('has a route for the order board and a walk-in order', async () => {
    stub()
    const { router } = await mountAt(StaffHomeView, '/staff/orders', { user: USERS.staff })
    expect(router.currentRoute.value.name).toBe('staff-orders')

    const { router: r2 } = await mountAt(StaffHomeView, '/staff/orders/new', { user: USERS.staff })
    expect(r2.currentRoute.value.name).toBe('staff-order-new')
  })
})
