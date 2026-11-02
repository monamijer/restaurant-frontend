import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ORDERING,
  EMPTY_FILTERS,
  hasActiveFilters,
  MAX_PAGE,
  PAGE_SIZE,
  parseMenuQuery,
  toApiParams,
  toRouteQuery,
  totalPages,
} from '@/utils/menuQuery'

describe('parseMenuQuery', () => {
  it('defaults to an unfiltered first page sorted by name', () => {
    expect(parseMenuQuery({})).toEqual(EMPTY_FILTERS)
    expect(parseMenuQuery()).toEqual(EMPTY_FILTERS)
  })

  it('reads every filter from the address', () => {
    const filters = parseMenuQuery({ q: ' fish ', category: 'mains', available: '1', ordering: '-price', page: '3' })

    expect(filters).toEqual({ search: 'fish', category: 'mains', availableOnly: true, ordering: '-price', page: 3 })
  })

  it('uses the first value when a parameter is repeated', () => {
    expect(parseMenuQuery({ q: ['a', 'b'], page: ['2', '5'] })).toMatchObject({ search: 'a', page: 2 })
  })

  it.each(['0', '-4', 'abc', '2.5x', '', null])('falls back to page 1 for %j', (page) => {
    expect(parseMenuQuery({ page }).page).toBe(page === '2.5x' ? 2 : 1)
  })

  it('caps absurd page numbers', () => {
    expect(parseMenuQuery({ page: '99999999' }).page).toBe(MAX_PAGE)
  })

  it('ignores an unknown sort order, so nothing arbitrary reaches the backend', () => {
    expect(parseMenuQuery({ ordering: 'password' }).ordering).toBe(DEFAULT_ORDERING)
  })

  it.each(['a b', '../x', 'x'.repeat(101), '<script>'])('drops the invalid category %j', (category) => {
    expect(parseMenuQuery({ category }).category).toBe('')
  })

  it('shortens an overlong search', () => {
    expect(parseMenuQuery({ q: 'x'.repeat(500) }).search).toHaveLength(100)
  })

  it('treats anything but 1 as "not only available"', () => {
    expect(parseMenuQuery({ available: 'true' }).availableOnly).toBe(false)
  })
})

describe('toRouteQuery', () => {
  it('leaves defaults out of the address', () => {
    expect(toRouteQuery(EMPTY_FILTERS)).toEqual({})
  })

  it('writes only what differs from the defaults', () => {
    const query = toRouteQuery({ search: 'fish', category: 'mains', availableOnly: true, ordering: 'price', page: 2 })

    expect(query).toEqual({ q: 'fish', category: 'mains', available: '1', ordering: 'price', page: '2' })
  })

  it('round-trips through parseMenuQuery', () => {
    const filters = { search: 'grillé', category: 'grillades', availableOnly: true, ordering: '-price', page: 4 }

    expect(parseMenuQuery(toRouteQuery(filters))).toEqual(filters)
  })
})

describe('toApiParams', () => {
  it('always sends a page size and an ordering', () => {
    expect(toApiParams(EMPTY_FILTERS)).toEqual({ page_size: PAGE_SIZE, ordering: 'name' })
  })

  it('maps the filters to the backend parameter names', () => {
    const params = toApiParams({ search: 'fish', category: 'mains', availableOnly: true, ordering: 'price', page: 3 })

    expect(params).toEqual({
      page_size: PAGE_SIZE,
      ordering: 'price',
      search: 'fish',
      category_slug: 'mains',
      is_available: true,
      page: 3,
    })
  })
})

describe('paging and filter state', () => {
  it('computes the number of pages, never fewer than one', () => {
    expect(totalPages(0)).toBe(1)
    expect(totalPages(PAGE_SIZE)).toBe(1)
    expect(totalPages(PAGE_SIZE + 1)).toBe(2)
    expect(totalPages(PAGE_SIZE * 3)).toBe(3)
  })

  it('does not count the sort order as a filter', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, ordering: 'price' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, category: 'mains' })).toBe(true)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, availableOnly: true })).toBe(true)
  })
})
