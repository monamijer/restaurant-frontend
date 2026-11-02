// The menu page keeps its filters in the address bar, so a filtered view can be shared,
// bookmarked and restored with the back button. These helpers convert between the address
// (?q=fish&category=mains&page=2), the filters used by the page and the backend parameters.

export const PAGE_SIZE = 12
export const DEFAULT_ORDERING = 'name'
export const MAX_SEARCH_LENGTH = 100
export const MAX_PAGE = 1000

export const ORDERING_OPTIONS = [
  { value: 'name', labelKey: 'menu.sort.nameAsc' },
  { value: 'price', labelKey: 'menu.sort.priceAsc' },
  { value: '-price', labelKey: 'menu.sort.priceDesc' },
  { value: 'preparation_time', labelKey: 'menu.sort.prepAsc' },
]

const ORDERINGS = ORDERING_OPTIONS.map((option) => option.value)
const SLUG_PATTERN = /^[\w-]{1,100}$/

export const EMPTY_FILTERS = Object.freeze({
  search: '',
  category: '',
  availableOnly: false,
  ordering: DEFAULT_ORDERING,
  page: 1,
})

const first = (value) => (Array.isArray(value) ? value[0] : value)

/** Read the filters from the address, ignoring anything unexpected. */
export function parseMenuQuery(query = {}) {
  const search = String(first(query.q) ?? '').trim().slice(0, MAX_SEARCH_LENGTH)
  const category = String(first(query.category) ?? '')
  const ordering = first(query.ordering)
  const page = Number.parseInt(first(query.page), 10)

  return {
    search,
    category: SLUG_PATTERN.test(category) ? category : '',
    availableOnly: first(query.available) === '1',
    ordering: ORDERINGS.includes(ordering) ? ordering : DEFAULT_ORDERING,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  }
}

/** The address for these filters; defaults are left out to keep it short. */
export function toRouteQuery(filters) {
  const query = {}
  if (filters.search) query.q = filters.search
  if (filters.category) query.category = filters.category
  if (filters.availableOnly) query.available = '1'
  if (filters.ordering !== DEFAULT_ORDERING) query.ordering = filters.ordering
  if (filters.page > 1) query.page = String(filters.page)
  return query
}

/** The parameters of GET /menu-items/. */
export function toApiParams(filters) {
  const params = { page_size: PAGE_SIZE, ordering: filters.ordering }
  if (filters.search) params.search = filters.search
  if (filters.category) params.category_slug = filters.category
  if (filters.availableOnly) params.is_available = true
  if (filters.page > 1) params.page = filters.page
  return params
}

export function totalPages(count) {
  return Math.max(1, Math.ceil(count / PAGE_SIZE))
}

/** True when something other than the sort order narrows the list. */
export function hasActiveFilters(filters) {
  return Boolean(filters.search || filters.category || filters.availableOnly)
}
