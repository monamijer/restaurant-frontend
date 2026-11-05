import { ROLES } from '@/utils/roles'

// The links of the main navigation. An item without `roles` is public. Later steps add the
// customer and staff pages here; the backend remains the real gatekeeper of every page.
export const NAV_ITEMS = [
  { name: 'home', labelKey: 'nav.home', route: { name: 'home' } },
  { name: 'menu', labelKey: 'nav.menu', route: { name: 'menu' } },
  { name: 'queue', labelKey: 'nav.queue', route: { name: 'queue' } },
  {
    name: 'reservations',
    labelKey: 'nav.reservations',
    route: { name: 'reservations' },
    roles: [ROLES.CLIENT, ROLES.STAFF, ROLES.ADMIN],
  },
  {
    name: 'orders',
    labelKey: 'nav.orders',
    route: { name: 'orders' },
    roles: [ROLES.CLIENT, ROLES.STAFF, ROLES.ADMIN],
  },
  {
    name: 'account',
    labelKey: 'nav.account',
    route: { name: 'client-account' },
    roles: [ROLES.CLIENT, ROLES.STAFF, ROLES.ADMIN],
  },
  { name: 'staff', labelKey: 'nav.staff', route: { name: 'staff-home' }, roles: [ROLES.STAFF, ROLES.ADMIN] },
  { name: 'admin', labelKey: 'nav.admin', route: { name: 'admin-home' }, roles: [ROLES.ADMIN] },
]

/** The items a visitor with this role (or none) should be offered. */
export function navItemsFor(role) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

/** The public items, shown in the category bar under the header. */
export function publicNavItems() {
  return NAV_ITEMS.filter((item) => !item.roles)
}
