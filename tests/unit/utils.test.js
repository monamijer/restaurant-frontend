import { describe, expect, it } from 'vitest'
import { formatClock, formatDateTime, formatMoney } from '@/utils/format'
import { safeRedirect } from '@/utils/redirect'
import { homeRouteFor, ROLES, STAFF_ROLES } from '@/utils/roles'

describe('safeRedirect', () => {
  it('accepts internal paths', () => {
    expect(safeRedirect('/staff/orders?status=ready')).toBe('/staff/orders?status=ready')
  })

  it.each([
    ['https://evil.example', 'an absolute address'],
    ['//evil.example', 'a protocol-relative address'],
    ['/\\evil.example', 'a backslash trick'],
    ['javascript:alert(1)', 'a script address'],
    ['orders', 'a path that is not rooted'],
    ['', 'an empty value'],
    [undefined, 'a missing value'],
    [['/a'], 'a non-string value'],
  ])('refuses %j (%s)', (target) => {
    expect(safeRedirect(target, '/home')).toBe('/home')
  })

  it('defaults to the site root', () => {
    expect(safeRedirect('nope')).toBe('/')
  })
})

describe('roles', () => {
  it('sends each role to its own area', () => {
    expect(homeRouteFor(ROLES.CLIENT)).toBe('client-account')
    expect(homeRouteFor(ROLES.STAFF)).toBe('staff-home')
    expect(homeRouteFor(ROLES.ADMIN)).toBe('admin-home')
  })

  it('sends an unknown role to the public home', () => {
    expect(homeRouteFor('guest')).toBe('home')
    expect(homeRouteFor(null)).toBe('home')
  })

  it('counts staff and administrators as staff', () => {
    expect(STAFF_ROLES).toEqual(['staff', 'admin'])
  })
})

describe('formatting', () => {
  it('formats an exact decimal string as money in the interface language', () => {
    expect(formatMoney('12.50', 'USD', 'en')).toBe('$12.50')
    expect(formatMoney('1234.5', 'USD', 'en')).toBe('$1,234.50')
    expect(formatMoney('12.50', 'USD', 'fr').replace(/\s/g, ' ')).toContain('12,50')
  })

  it('shows nothing for an amount that is not a number', () => {
    expect(formatMoney('abc')).toBe('')
    expect(formatMoney(undefined)).toBe('')
  })

  it('formats a date and time in a chosen time zone', () => {
    const text = formatDateTime('2026-10-10T17:00:00Z', 'en', 'UTC')

    expect(text).toContain('Oct 10, 2026')
    expect(text).toContain('5:00')
  })

  it('shows nothing for a missing date', () => {
    expect(formatDateTime(null)).toBe('')
  })

  it('trims seconds from a clock time', () => {
    expect(formatClock('09:00:00')).toBe('09:00')
    expect(formatClock(undefined)).toBe('')
  })
})
