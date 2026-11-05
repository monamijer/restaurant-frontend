import { describe, it, expect } from 'vitest'
import { fakeServer, reply } from '../helpers/http'
import { settingsService } from '../../src/services/settingsService'

describe('settingsService.update', () => {
  it('PATCHes the settings and returns the updated resource', async () => {
    const server = fakeServer((config) => reply(config, 200, { name: 'New name' }))
    const result = await settingsService.update({ name: 'New name', tax_rate: '10.00' })
    expect(result).toEqual({ name: 'New name' })
    const [request] = server
    expect(request.method).toBe('patch')
    expect(request.url).toBe('/settings/')
    expect(JSON.parse(request.body)).toEqual({ name: 'New name', tax_rate: '10.00' })
  })
})
