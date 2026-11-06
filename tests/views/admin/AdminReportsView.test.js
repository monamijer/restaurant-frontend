import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminReportsView from '../../../src/views/admin/AdminReportsView.vue'
import { adminReportService } from '../../../src/services/adminReportService'

const REVENUE = {
  start: '2026-11-01',
  end: '2026-11-05',
  results: [
    { period: '2026-11-04', revenue: '500.00', orders: 5, average_order_value: '100.00' },
    { period: '2026-11-05', revenue: '700.00', orders: 7, average_order_value: '100.00' },
  ],
}

describe('AdminReportsView', () => {
  it('reads the revenue report by default and displays the rows', async () => {
    vi.spyOn(adminReportService, 'revenue').mockResolvedValue(REVENUE)
    const { wrapper } = await mountAt(AdminReportsView, '/admin/reports', { user: USERS.admin })
    await flushPromises()
    const rows = wrapper.findAll('.table-wrap tbody tr')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('$500.00')
    expect(wrapper.text()).toContain('$700.00')
  })

  it('passes the start, end and group_by to the service', async () => {
    const spy = vi.spyOn(adminReportService, 'revenue').mockResolvedValue({ results: [] })
    await mountAt(
      AdminReportsView,
      '/admin/reports?report=revenue&start=2026-11-01&end=2026-11-05&group_by=week',
      { user: USERS.admin },
    )
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ start: '2026-11-01', end: '2026-11-05', group_by: 'week' })
  })

  it('switches to the peak hours report when the selector changes', async () => {
    vi.spyOn(adminReportService, 'revenue').mockResolvedValue({ results: [] })
    const peakSpy = vi.spyOn(adminReportService, 'peakHours').mockResolvedValue({
      results: [{ hour: 12, orders: 4, revenue: '40.00' }],
    })
    const { wrapper } = await mountAt(AdminReportsView, '/admin/reports', { user: USERS.admin })
    await flushPromises()
    await wrapper.find('select.control').setValue('peak-hours')
    await flushPromises()
    expect(peakSpy).toHaveBeenCalled()
    expect(wrapper.text()).toContain('12')
  })

  it('treats the payments report as CSV only', async () => {
    vi.spyOn(adminReportService, 'revenue').mockResolvedValue({ results: [] })
    const { wrapper } = await mountAt(
      AdminReportsView,
      '/admin/reports?report=payments',
      { user: USERS.admin },
    )
    await flushPromises()
    expect(wrapper.text()).toContain('CSV')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('downloads the CSV for the current report', async () => {
    vi.spyOn(adminReportService, 'revenue').mockResolvedValue({ results: [] })
    const csvSpy = vi.spyOn(adminReportService, 'csv').mockResolvedValue(new Blob(['a,b']))
    const { wrapper } = await mountAt(AdminReportsView, '/admin/reports', { user: USERS.admin })
    await flushPromises()
    const button = wrapper.findAll('button').find((b) => b.text() === 'Download as CSV')
    await button.trigger('click')
    await flushPromises()
    expect(csvSpy).toHaveBeenCalledWith('/reports/revenue/', { group_by: 'day' })
  })

  it('offers a retry when the report fails', async () => {
    vi.spyOn(adminReportService, 'revenue').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminReportsView, '/admin/reports', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the report.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
