import { describe, expect, it } from 'vitest'
import { navItemsFor } from '@/config/navigation'
import { isBlank, isEmail } from '@/utils/validation'

const names = (role) => navItemsFor(role).map((item) => item.name)

describe('navigation', () => {
  it('offers visitors only the public pages', () => {
    expect(names(null)).toEqual(['home', 'menu', 'queue'])
  })

  it('adds the account for customers', () => {
    expect(names('client')).toEqual(['home', 'menu', 'queue', 'reservations', 'orders', 'account'])
  })

  it('adds the staff area for staff', () => {
    expect(names('staff')).toEqual(['home', 'menu', 'queue', 'reservations', 'orders', 'account', 'staff'])
  })

  it('offers administrators everything', () => {
    expect(names('admin')).toEqual(['home', 'menu', 'queue', 'reservations', 'orders', 'account', 'staff', 'admin'])
  })
})

describe('validation', () => {
  it.each(['a@b.co', ' a@b.co ', 'first.last@sub.example.org'])('accepts %j', (value) => {
    expect(isEmail(value)).toBe(true)
  })

  it.each(['', 'plain', 'a@b', '@b.co', 'a b@c.de', null])('rejects %j', (value) => {
    expect(isEmail(value)).toBe(false)
  })

  it('spots blank values', () => {
    expect(isBlank('   ')).toBe(true)
    expect(isBlank(undefined)).toBe(true)
    expect(isBlank('x')).toBe(false)
  })
})
