// Role values and the page each role lands on. The backend is the authority on permissions:
// these helpers only decide what to show and where to send people.

export const ROLES = Object.freeze({ CLIENT: 'client', STAFF: 'staff', ADMIN: 'admin' })

export const STAFF_ROLES = Object.freeze([ROLES.STAFF, ROLES.ADMIN])

const HOME_ROUTE_BY_ROLE = {
  [ROLES.CLIENT]: 'client-account',
  [ROLES.STAFF]: 'staff-home',
  [ROLES.ADMIN]: 'admin-home',
}

export function homeRouteFor(role) {
  return HOME_ROUTE_BY_ROLE[role] ?? 'home'
}
