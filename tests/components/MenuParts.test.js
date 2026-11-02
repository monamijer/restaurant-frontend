import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BasePagination from '@/components/common/BasePagination.vue'
import MenuFilters from '@/components/menu/MenuFilters.vue'
import MenuItemCard from '@/components/menu/MenuItemCard.vue'
import { applyLocale } from '@/i18n'
import { useUiStore } from '@/store/ui'
import { EMPTY_FILTERS } from '@/utils/menuQuery'
import { mountAt } from '../helpers/app'

const DISH = {
  id: 7,
  category: 1,
  category_name: 'Mains',
  name: 'Grilled fish',
  slug: 'grilled-fish',
  description: 'Fresh fish, rice and vegetables.',
  price: '12.50',
  image: 'http://localhost:8000/media/menu/grilled-fish.jpg',
  is_available: true,
  preparation_time: 20,
  is_featured: false,
  allergens: [],
  calories: 540,
}

describe('MenuItemCard', () => {
  it('shows the dish and links to its page through a single link', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: DISH } })

    expect(wrapper.get('h3').text()).toBe('Grilled fish')
    expect(wrapper.text()).toContain('$12.50')
    expect(wrapper.text()).toContain('About 20 min')
    expect(wrapper.text()).toContain('Mains')
    expect(wrapper.findAll('a')).toHaveLength(1)
    expect(wrapper.get('a').attributes('href')).toBe('/menu/7')
  })

  it('uses the picture as decoration, loaded lazily', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: DISH } })

    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe(DISH.image)
    expect(image.attributes('alt')).toBe('')
    expect(image.attributes('loading')).toBe('lazy')
  })

  it('falls back to an icon when a dish has no picture', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: { ...DISH, image: null } } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('marks an unavailable dish instead of hiding it', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: { ...DISH, is_available: false } } })

    expect(wrapper.classes()).toContain('dish--unavailable')
    expect(wrapper.text()).toContain('Unavailable')
    expect(wrapper.text()).not.toContain('About 20 min')
  })

  it('flags featured dishes', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: { ...DISH, is_featured: true } } })

    expect(wrapper.text()).toContain('Featured')
  })

  it('formats the price in the interface language', async () => {
    const { wrapper } = await mountAt(MenuItemCard, '/menu', { props: { item: DISH } })

    useUiStore().setLocale('fr')
    await wrapper.vm.$nextTick()

    expect(wrapper.text().replace(/\s/g, ' ')).toMatch(/12,50/)
    applyLocale('en')
  })
})

describe('BasePagination', () => {
  it('stays hidden when everything fits on one page', async () => {
    const { wrapper } = await mountAt(BasePagination, '/', { props: { page: 1, totalPages: 1 } })

    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('shows where the visitor is and moves page by page', async () => {
    const { wrapper } = await mountAt(BasePagination, '/', { props: { page: 2, totalPages: 4 } })

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Pagination')
    expect(wrapper.text()).toContain('Page 2 of 4')
    const [previous, next] = wrapper.findAll('button')
    await previous.trigger('click')
    await next.trigger('click')

    expect(wrapper.emitted('change')).toEqual([[1], [3]])
  })

  it('disables the buttons at both ends', async () => {
    const first = await mountAt(BasePagination, '/', { props: { page: 1, totalPages: 3 } })
    const last = await mountAt(BasePagination, '/', { props: { page: 3, totalPages: 3 } })

    expect(first.wrapper.findAll('button')[0].attributes('disabled')).toBeDefined()
    expect(last.wrapper.findAll('button')[1].attributes('disabled')).toBeDefined()
  })
})

describe('MenuFilters', () => {
  const CATEGORIES = [
    { id: 1, name: 'Mains', slug: 'mains' },
    { id: 2, name: 'Desserts', slug: 'desserts' },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function filters(props = {}) {
    return mountAt(MenuFilters, '/menu', { props: { filters: EMPTY_FILTERS, categories: CATEGORIES, ...props } })
  }

  it('offers every category plus "All", and says which one is active', async () => {
    const { wrapper } = await filters({ filters: { ...EMPTY_FILTERS, category: 'desserts' } })

    const chips = wrapper.findAll('.chip')
    expect(chips.map((chip) => chip.text())).toEqual(['All', 'Mains', 'Desserts'])
    expect(chips.map((chip) => chip.attributes('aria-pressed'))).toEqual(['false', 'false', 'true'])
  })

  it('reports a chosen category, and "All" clears it', async () => {
    const { wrapper } = await filters()

    await wrapper.findAll('.chip')[1].trigger('click')
    await wrapper.findAll('.chip')[0].trigger('click')

    expect(wrapper.emitted('change')).toEqual([[{ category: 'mains' }], [{ category: '' }]])
  })

  it('waits for a pause in typing before searching', async () => {
    const { wrapper } = await filters()
    const input = wrapper.get('input[name="q"]')

    await input.setValue('fi')
    await input.setValue('fish ')
    vi.advanceTimersByTime(300)
    expect(wrapper.emitted('change')).toBeUndefined()

    vi.advanceTimersByTime(100)
    expect(wrapper.emitted('change')).toEqual([[{ search: 'fish' }]])
  })

  it('does not search again for text that is already applied', async () => {
    const { wrapper } = await filters({ filters: { ...EMPTY_FILTERS, search: 'fish' } })

    await wrapper.get('input[name="q"]').setValue('fish ')
    vi.advanceTimersByTime(1000)

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('follows the address when the search is cleared from outside', async () => {
    const { wrapper } = await filters({ filters: { ...EMPTY_FILTERS, search: 'fish' } })
    expect(wrapper.get('input[name="q"]').element.value).toBe('fish')

    await wrapper.setProps({ filters: { ...EMPTY_FILTERS, search: '' } })

    expect(wrapper.get('input[name="q"]').element.value).toBe('')
  })

  it('reports the sort order and the availability switch', async () => {
    const { wrapper } = await filters()

    await wrapper.get('select').setValue('-price')
    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('change')).toEqual([[{ ordering: '-price' }], [{ availableOnly: true }]])
  })

  it('lists the sort choices in the interface language', async () => {
    const { wrapper } = await filters()

    expect(wrapper.findAll('option').map((option) => option.text())).toEqual([
      'Name (A to Z)',
      'Price: low to high',
      'Price: high to low',
      'Fastest to prepare',
    ])
  })

  it('offers to clear the filters only when some are active', async () => {
    const idle = await filters()
    const active = await filters({ filters: { ...EMPTY_FILTERS, category: 'mains' } })

    expect(idle.wrapper.text()).not.toContain('Clear filters')
    expect(active.wrapper.text()).toContain('Clear filters')

    await active.wrapper.findAll('button').find((button) => button.text() === 'Clear filters').trigger('click')
    expect(active.wrapper.emitted('reset')).toHaveLength(1)
  })
})
