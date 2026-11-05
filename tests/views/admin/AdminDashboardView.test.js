import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminDashboardView from '../../../src/views/admin/AdminDashboardView.vue'
import { adminDashboardService } from '../../../src/services/adminDashboardService'

const STATS = {
  period: { start: '2026-11-01', end: '2026-11-05', days: 5 },
  kpis: {
    revenue: { value: '1200.00', previous: '1000.00', change_percent: 20.0 },
    orders: { value: 12, previous: 10, change_percent: 20.0 },
    average_order_value: { value: '100.00', previous: '100.00', change_percent: 0.0 },
    new_customers: { value: 3, previous: 0, change_percent: null },
  },
  customers_total: 20,
  today: {
    reservations_today: 2, pending_reservations: 1, queue_waiting: 4,
    orders_in_progress: 3, pending_payments: 1,
    tables: { total: 10, available: 5, occupied: 4, reserved: 1, cleaning: 0, occupancy_percent: 40.0 },
  },
  revenue_over_time: [
    { period: '2026-11-04', revenue: '500.00', orders: 5, average_order_value: '100.00' },
    { period: '2026-11-05', revenue: '700.00', orders: 7, average_order_value: '100.00' },
  ],
  orders_over_time: [
    { period: '2026-11-04', total: 5, dine_in: 3, takeaway: 2, delivery: 0, cancelled: 0 },
    { period: '2026-11-05', total: 7, dine_in: 4, takeaway: 2, delivery: 1, cancelled: 0 },
  ],
  top_items: [
    { menu_item: 1, name: 'Pasta', quantity: 8, revenue: '96.00' },
  ],
  recent_activity: [
    { type: 'order', id: 42, at: '2026-11-05T12:00:00Z', status: 'pending', amount: '34.10' },
    { type: 'payment', id: 12, at: '2026-11-05T12:05:00Z', status: 'paid', amount: '34.10' },
  ],
}

function stub(data = STATS) {
  vi.spyOn(adminDashboardService, 'stats').mockResolvedValue(data)
}

describe('AdminDashboardView', () => {
  it('shows the KPIs, today snapshot, series, top items and activity', async () => {
    stub()
    const { wrapper } = await mountAt(AdminDashboardView, '/admin/dashboard', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Revenue')
    expect(wrapper.text()).toContain('$1,200.00')
    expect(wrapper.text()).toContain('New customers')
    expect(wrapper.text()).toContain('Occupied tables')
    expect(wrapper.text()).toContain('Pasta')
    expect(wrapper.text()).toContain('Order')
    expect(wrapper.text()).toContain('Payment')
  })

  it('shows a neutral indicator when change_percent is null', async () => {
    stub()
    const { wrapper } = await mountAt(AdminDashboardView, '/admin/dashboard', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('No comparison available')
  })

  it('passes the period filters to the service', async () => {
    stub()
    await mountAt(AdminDashboardView, '/admin/dashboard?start=2026-11-01&end=2026-11-05&group_by=week', { user: USERS.admin })
    await flushPromises()
    expect(adminDashboardService.stats).toHaveBeenCalledWith({
      group_by: 'week', start: '2026-11-01', end: '2026-11-05',
    })
  })

  it('offers a retry when the dashboard fails', async () => {
    vi.spyOn(adminDashboardService, 'stats').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminDashboardView, '/admin/dashboard', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the dashboard.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
