import { describe, it, expect } from 'vitest'
import { fakeServer, reply } from '../helpers/http'
import { adminDashboardService } from '../../src/services/adminDashboardService'

describe('adminDashboardService', () => {
  it('reads the dashboard with the given period and bucket', async () => {
    const server = fakeServer((config) => reply(config, 200, { period: {}, kpis: {} }))
    const data = await adminDashboardService.stats({ start: '2026-11-01', end: '2026-11-05', group_by: 'week' })
    expect(data.kpis).toEqual({})
    const [request] = server
    expect(request.method).toBe('get')
    expect(request.url).toBe('/dashboard/stats/')
  })
})
