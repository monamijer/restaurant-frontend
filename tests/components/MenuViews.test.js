import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { menuService } from '@/services/menuService'
import { useMenuStore } from '@/store/menu'
import { ApiError } from '@/utils/errors'
import { PAGE_SIZE } from '@/utils/menuQuery'
import MenuItemView from '@/views/MenuItemView.vue'
import MenuView from '@/views/MenuView.vue'
import { mountAt } from '../helpers/app'

const dish = (id, overrides = {}) => ({
  id,
  category: 1,
  category_name: 'Mains',
  name: `Dish ${id}`,
  slug: `dish-${id}`,
  description: 'Tasty.',
  price: '10.00',
  image: null,
  is_available: true,
  preparation_time: 15,
  is_featured: false,
  allergens: [],
  calories: 400,
  ...overrides,
})

const page = (results, count = results.length) => ({ count, next: null, previous: null, results })

let items

beforeEach(() => {
  items = vi.spyOn(menuService, 'items').mockResolvedValue(page([dish(1), dish(2)]))
  vi.spyOn(menuService, 'categories').mockResolvedValue([
    { id: 1, name: 'Mains', slug: 'mains' },
    { id: 2, name: 'Desserts', slug: 'desserts' },
  ])
})

describe('MenuView', () => {
  it('loads the first page and shows the dishes and the count', async () => {
    const { wrapper } = await mountAt(MenuView, '/menu')

    expect(items).toHaveBeenCalledWith({ page_size: PAGE_SIZE, ordering: 'name' })
    expect(wrapper.findAll('h3').map((title) => title.text())).toEqual(['Dish 1', 'Dish 2'])
    expect(wrapper.get('[role="status"]').text()).toBe('2 dishes')
  })

  it('says "1 dish" in the singular', async () => {
    items.mockResolvedValue(page([dish(1)]))
    const { wrapper } = await mountAt(MenuView, '/menu')

    expect(wrapper.get('[role="status"]').text()).toBe('1 dish')
  })

  it('loads the categories into the filter buttons', async () => {
    const { wrapper } = await mountAt(MenuView, '/menu')

    expect(wrapper.findAll('.chip').map((chip) => chip.text())).toEqual(['All', 'Mains', 'Desserts'])
    expect(useMenuStore().loaded).toBe(true)
  })

  it('applies the filters found in the address', async () => {
    await mountAt(MenuView, '/menu?q=fish&category=mains&available=1&ordering=-price&page=2')

    expect(items).toHaveBeenCalledWith({
      page_size: PAGE_SIZE,
      ordering: '-price',
      search: 'fish',
      category_slug: 'mains',
      is_available: true,
      page: 2,
    })
  })

  it('choosing a category updates the address and reloads the list', async () => {
    const { wrapper, router } = await mountAt(MenuView, '/menu')

    await wrapper.findAll('.chip')[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ category: 'mains' })
    expect(items).toHaveBeenLastCalledWith({ page_size: PAGE_SIZE, ordering: 'name', category_slug: 'mains' })
  })

  it('goes back to the first page when a filter changes', async () => {
    items.mockResolvedValue(page([dish(1)], PAGE_SIZE * 3))
    const { wrapper, router } = await mountAt(MenuView, '/menu?page=3')

    await wrapper.findAll('.chip')[2].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ category: 'desserts' })
  })

  it('pages through the results', async () => {
    items.mockResolvedValue(page([dish(1)], PAGE_SIZE * 3))
    const { wrapper, router } = await mountAt(MenuView, '/menu')

    expect(wrapper.text()).toContain('Page 1 of 3')
    await wrapper.findAll('nav button')[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    expect(items).toHaveBeenLastCalledWith({ page_size: PAGE_SIZE, ordering: 'name', page: 2 })
  })

  it('returns to the first page when the requested page no longer exists', async () => {
    items.mockRejectedValueOnce(new ApiError({ status: 404, code: 'NOT_FOUND' }))
    const { router } = await mountAt(MenuView, '/menu?page=9')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
    expect(items).toHaveBeenCalledTimes(2)
  })

  it('shows an empty state that offers to clear the filters', async () => {
    items.mockResolvedValue(page([]))
    const { wrapper, router } = await mountAt(MenuView, '/menu?q=nothing')

    expect(wrapper.text()).toContain('No dish matches')
    await wrapper.findAll('button').filter((button) => button.text() === 'Clear filters').at(-1).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
  })

  it('keeps the chosen sort order when the filters are cleared', async () => {
    items.mockResolvedValue(page([]))
    const { wrapper, router } = await mountAt(MenuView, '/menu?q=nothing&ordering=price')

    await wrapper.findAll('button').filter((button) => button.text() === 'Clear filters').at(-1).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ ordering: 'price' })
  })

  it('explains an unreachable server and lets the visitor retry', async () => {
    items.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))
    const { wrapper } = await mountAt(MenuView, '/menu')

    expect(wrapper.text()).toContain('The menu could not be loaded.')
    await wrapper.findAll('button').find((button) => button.text() === 'Try again').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('h3')).toHaveLength(2)
  })

  it('ignores a slow answer that arrives after a newer request', async () => {
    let releaseFirst
    items.mockReturnValueOnce(new Promise((resolve) => (releaseFirst = resolve)))
    items.mockResolvedValueOnce(page([dish(9)]))
    const { wrapper } = await mountAt(MenuView, '/menu')

    await wrapper.findAll('.chip')[1].trigger('click')
    await flushPromises()
    releaseFirst(page([dish(1), dish(2)]))
    await flushPromises()

    expect(wrapper.findAll('h3').map((title) => title.text())).toEqual(['Dish 9'])
  })

  it('still shows the dishes when the categories cannot be loaded', async () => {
    menuService.categories.mockRejectedValue(new Error('offline'))
    const { wrapper } = await mountAt(MenuView, '/menu')

    expect(wrapper.findAll('h3')).toHaveLength(2)
    expect(wrapper.findAll('.chip').map((chip) => chip.text())).toEqual(['All'])
  })
})

describe('MenuItemView', () => {
  const full = dish(7, {
    name: 'Grilled fish',
    price: '16.50',
    image: 'http://localhost:8000/media/menu/fish.jpg',
    allergens: ['poisson', 'gluten'],
    calories: 540,
    is_featured: true,
    preparation_time: 20,
  })

  it('shows the whole dish', async () => {
    vi.spyOn(menuService, 'item').mockResolvedValue(full)
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')

    expect(menuService.item).toHaveBeenCalledWith('7')
    expect(wrapper.get('h1').text()).toBe('Grilled fish')
    expect(wrapper.text()).toContain('$16.50')
    expect(wrapper.text()).toContain('About 20 minutes')
    expect(wrapper.text()).toContain('540 kcal')
    expect(wrapper.text()).toContain('Featured')
    expect(wrapper.findAll('.badge--warning').map((badge) => badge.text())).toEqual(['poisson', 'gluten'])
    expect(wrapper.get('img').attributes('alt')).toBe('Grilled fish')
  })

  it('says so when no allergen is declared and hides missing calories', async () => {
    vi.spyOn(menuService, 'item').mockResolvedValue({ ...full, allergens: [], calories: null })
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')

    expect(wrapper.text()).toContain('None declared')
    expect(wrapper.text()).not.toContain('kcal')
  })

  it('marks an unavailable dish', async () => {
    vi.spyOn(menuService, 'item').mockResolvedValue({ ...full, is_available: false })
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')

    expect(wrapper.text()).toContain('Unavailable')
  })

  it('explains a dish that does not exist', async () => {
    vi.spyOn(menuService, 'item').mockRejectedValue(new ApiError({ status: 404, code: 'NOT_FOUND' }))
    const { wrapper } = await mountAt(MenuItemView, '/menu/999')

    expect(wrapper.text()).toContain('This dish does not exist')
  })

  it('reports a technical failure and can retry', async () => {
    const item = vi.spyOn(menuService, 'item')
    item.mockRejectedValueOnce(new ApiError({ status: 500, code: 'SERVER_ERROR' })).mockResolvedValueOnce(full)
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')

    expect(wrapper.text()).toContain('The dish could not be loaded.')
    await wrapper.findAll('button').find((button) => button.text() === 'Try again').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Grilled fish')
  })

  it('links back to the menu', async () => {
    vi.spyOn(menuService, 'item').mockResolvedValue(full)
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')

    expect(wrapper.get('a').attributes('href')).toBe('/menu')
  })
})
