import { describe, it, expect } from 'vitest'
import { fakeServer, reply } from '../helpers/http'
import { adminReportService } from '../../src/services/adminReportService'

describe('adminReportService', () => {
  it('reads the revenue report', async () => {
    const server = fakeServer((config) => reply(config, 200, { start: '2026-11-01', end: '2026-11-05', results: [] }))
    const data = await adminReportService.revenue({ start: '2026-11-01', end: '2026-11-05' })
    expect(data.results).toEqual([])
    expect(server[0].url).toBe('/reports/revenue/')
  })

  it('reads the peak hours report', async () => {
    const server = fakeServer((config) => reply(config, 200, { results: [] }))
    await adminReportService.peakHours({})
    expect(server[0].url).toBe('/reports/peak-hours/')
  })

  it('downloads the CSV with export=csv', async () => {
    let captured
    fakeServer((config) => {
      captured = config
      return reply(config, 200, 'a,b\n1,2')
    })
    const blob = await adminReportService.csv('/reports/payments/', { start: '2026-11-01' })
    expect(captured.url).toBe('/reports/payments/')
    expect(captured.params).toEqual({ start: '2026-11-01', export: 'csv' })
    expect(blob).toBeTruthy()
  })
})
