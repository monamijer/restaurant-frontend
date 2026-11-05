import { describe, it, expect } from 'vitest'
import { fakeServer, reply } from '../helpers/http'
import { adminUserService } from '../../src/services/adminUserService'

describe('adminUserService', () => {
  it('lists users with the given query', async () => {
    const server = fakeServer((config) => reply(config, 200, { count: 0, next: null, previous: null, results: [] }))
    await adminUserService.list({ role: 'client', search: 'ada' })
    const [request] = server
    expect(request.method).toBe('get')
    expect(request.url).toBe('/users/')
  })

  it('creates a user', async () => {
    const server = fakeServer((config) => reply(config, 201, { id: 5 }))
    const created = await adminUserService.create({
      email: 'new@example.com', password: 'p', first_name: 'A', last_name: 'B', role: 'staff',
    })
    expect(created.id).toBe(5)
    const body = JSON.parse(server[0].body)
    expect(body.role).toBe('staff')
  })

  it('PATCHes the user with the editable fields', async () => {
    const server = fakeServer((config) => reply(config, 200, { id: 5, first_name: 'A2' }))
    await adminUserService.update(5, { first_name: 'A2', is_active: true })
    const [request] = server
    expect(request.method).toBe('patch')
    expect(request.url).toBe('/users/5/')
    expect(JSON.parse(request.body)).toEqual({ first_name: 'A2', is_active: true })
  })

  it('posts the password to set-password and expects 204', async () => {
    const server = fakeServer((config) => reply(config, 204))
    await adminUserService.setPassword(5, 'new-secret')
    const [request] = server
    expect(request.method).toBe('post')
    expect(request.url).toBe('/users/5/set-password/')
    expect(JSON.parse(request.body)).toEqual({ password: 'new-secret' })
  })

  it('deactivates through a PATCH', async () => {
    const server = fakeServer((config) => reply(config, 200, { id: 5, is_active: false }))
    const updated = await adminUserService.setActive(5, false)
    expect(updated.is_active).toBe(false)
    expect(JSON.parse(server[0].body)).toEqual({ is_active: false })
  })
})
