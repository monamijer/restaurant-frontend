import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { menuService } from '@/services/menuService'
import { session } from '@/services/session'
import { useMenuStore } from '@/store/menu'
import { envelope, fakeServer, reply } from '../helpers/http'

beforeEach(() => {
  session.clear()
  setActivePinia(createPinia())
})

describe('menuService', () => {
  it('reads the categories without credentials, even when signed in', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 200, [{ id: 1, name: 'Mains', slug: 'mains' }]))

    const categories = await menuService.categories()

    expect(categories).toEqual([{ id: 1, name: 'Mains', slug: 'mains' }])
    expect(requests[0].url).toBe('/categories/')
    expect(requests[0].auth).toBeUndefined()
  })

  it('passes the filters as query parameters', async () => {
    let seen
    fakeServer((config) => {
      seen = config.params
      return reply(config, 200, { count: 0, next: null, previous: null, results: [] })
    })

    await menuService.items({ search: 'fish', page_size: 12 })

    expect(seen).toEqual({ search: 'fish', page_size: 12 })
  })

  it('reads one dish by id', async () => {
    const requests = fakeServer((config) => reply(config, 200, { id: 7, name: 'Fish' }))

    const item = await menuService.item(7)

    expect(item.name).toBe('Fish')
    expect(requests[0].url).toBe('/menu-items/7/')
  })

  it('reports a missing dish as a 404', async () => {
    fakeServer((config) => reply(config, 404, envelope('NOT_FOUND', 'Not found.')))

    const error = await menuService.item(9).catch((e) => e)

    expect(error.status).toBe(404)
  })
})

describe('menu store', () => {
  it('loads the categories once', async () => {
    const load = vi.spyOn(menuService, 'categories').mockResolvedValue([{ id: 1, name: 'Mains', slug: 'mains' }])
    const menu = useMenuStore()

    await menu.loadCategories()
    await menu.loadCategories()

    expect(load).toHaveBeenCalledOnce()
    expect(menu.categories).toHaveLength(1)
    expect(menu.loaded).toBe(true)
  })

  it('reports a failure without throwing and can try again', async () => {
    const load = vi.spyOn(menuService, 'categories')
    load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ id: 2, name: 'Desserts', slug: 'desserts' }])
    const menu = useMenuStore()

    await menu.loadCategories()
    expect(menu.failed).toBe(true)
    expect(menu.loaded).toBe(false)

    await menu.loadCategories()
    expect(menu.failed).toBe(false)
    expect(menu.categories[0].slug).toBe('desserts')
  })
})
