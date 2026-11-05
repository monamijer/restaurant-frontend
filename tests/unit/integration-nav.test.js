import { describe, it, expect, vi } from 'vitest'
import { mountAt, USERS } from '../helpers/app'
import AreaPlaceholderView from '../../src/views/AreaPlaceholderView.vue'
import { adminDashboardService } from '../../src/services/adminDashboardService'
import { adminMenuService } from '../../src/services/adminMenuService'
import { adminUserService } from '../../src/services/adminUserService'
import { adminCategoryService } from '../../src/services/adminCategoryService'
import { adminReportService } from '../../src/services/adminReportService'
import { menuService } from '../../src/services/menuService'
import { settingsService } from '../../src/services/settingsService'
import staffOrderService from '../../src/services/staffOrderService'
import staffPaymentService from '../../src/services/staffPaymentService'
import { staffReservationService } from '../../src/services/staffReservationService'
import { staffQueueService } from '../../src/services/staffQueueService'
import { staffTableService } from '../../src/services/staffTableService'
import dashboardService from '../../src/services/dashboardService'
import { invoiceService } from '../../src/services/invoiceService'

const STAFF_ROUTES = [
  '/staff',
  '/staff/orders',
  '/staff/orders/new',
  '/staff/orders/1',
  '/staff/reservations',
  '/staff/queue',
  '/staff/tables',
]

const ADMIN_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/categories',
  '/admin/menu',
  '/admin/menu/new',
  '/admin/menu/1/edit',
  '/admin/settings',
  '/admin/users',
  '/admin/users/new',
  '/admin/users/1/edit',
  '/admin/reports',
]

function stubBackend() {
  // Dashboard
  vi.spyOn(dashboardService, 'stats').mockResolvedValue({ today: {} })
  vi.spyOn(adminDashboardService, 'stats').mockResolvedValue({
    period: { start: '2026-11-01', end: '2026-11-05', days: 5 },
    kpis: {
      revenue: { value: '0', previous: '0', change_percent: null },
      orders: { value: 0, previous: 0, change_percent: null },
      average_order_value: { value: '0', previous: '0', change_percent: null },
      new_customers: { value: 0, previous: 0, change_percent: null },
    },
    customers_total: 0,
    today: { reservations_today: 0, pending_reservations: 0, queue_waiting: 0, orders_in_progress: 0, pending_payments: 0, tables: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0, occupancy_percent: 0 } },
    revenue_over_time: [],
    orders_over_time: [],
    top_items: [],
    recent_activity: [],
  })
  // Admin
  vi.spyOn(adminCategoryService, 'list').mockResolvedValue([])
  vi.spyOn(adminMenuService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(adminMenuService, 'get').mockResolvedValue({ id: 1, name: 'X', category: 1, price: '0' })
  vi.spyOn(adminUserService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(adminUserService, 'get').mockResolvedValue({ id: 1, role: 'client', is_active: true })
  vi.spyOn(adminReportService, 'revenue').mockResolvedValue({ results: [] })
  vi.spyOn(menuService, 'categories').mockResolvedValue([])
  vi.spyOn(menuService, 'items').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(settingsService, 'get').mockResolvedValue({})
  // Staff
  vi.spyOn(staffOrderService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(staffOrderService, 'get').mockResolvedValue({ id: 1, items: [] })
  vi.spyOn(staffPaymentService, 'listForOrder').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(staffReservationService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(staffQueueService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(staffTableService, 'list').mockResolvedValue({ count: 0, results: [] })
  vi.spyOn(invoiceService, 'forOrder').mockResolvedValue(null)
}

describe('integration: route access per role', () => {
  it('lets staff reach every staff route', async () => {
    stubBackend()
    for (const path of STAFF_ROUTES) {
      const { router } = await mountAt(AreaPlaceholderView, path, { user: USERS.staff })
      expect(router.currentRoute.value.path, `staff ${path}`).toBe(path)
    }
  })

  it('lets admins reach every staff and admin route', async () => {
    stubBackend()
    for (const path of [...STAFF_ROUTES, ...ADMIN_ROUTES]) {
      const { router } = await mountAt(AreaPlaceholderView, path, { user: USERS.admin })
      expect(router.currentRoute.value.path, `admin ${path}`).toBe(path)
    }
  })

  it('redirects a client away from every staff and admin route', async () => {
    stubBackend()
    for (const path of [...STAFF_ROUTES, ...ADMIN_ROUTES]) {
      const { router } = await mountAt(AreaPlaceholderView, path, { user: USERS.client })
      expect(router.currentRoute.value.name, `client ${path}`).toBe('forbidden')
    }
  })

  it('redirects a staff away from every admin route', async () => {
    stubBackend()
    for (const path of ADMIN_ROUTES) {
      const { router } = await mountAt(AreaPlaceholderView, path, { user: USERS.staff })
      expect(router.currentRoute.value.name, `staff ${path}`).toBe('forbidden')
    }
  })

  it('redirects anonymous visitors to the login page with a redirect query', async () => {
    stubBackend()
    for (const path of [...STAFF_ROUTES, ...ADMIN_ROUTES]) {
      const { router } = await mountAt(AreaPlaceholderView, path, { user: null })
      expect(router.currentRoute.value.name, `anonymous ${path}`).toBe('login')
      expect(router.currentRoute.value.query.redirect, `anonymous ${path}`).toBe(path)
    }
  })
})
