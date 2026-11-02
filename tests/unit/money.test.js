import { describe, expect, it } from 'vitest'
import { centsToAmount, estimateTaxCents, toCents } from '@/utils/money'

describe('toCents', () => {
  it.each([
    ['12.50', 1250],
    ['12.5', 1250],
    ['12', 1200],
    ['0.05', 5],
    ['0', 0],
    [' 7.00 ', 700],
  ])('reads %j as %i cents', (amount, cents) => {
    expect(toCents(amount)).toBe(cents)
  })

  it.each(['', 'abc', '-1.00', '1.234', '1,50', null, undefined])('treats %j as nothing', (amount) => {
    expect(toCents(amount)).toBe(0)
  })

  it('has no floating-point drift where decimals would', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in floating point; in cents it is exact.
    expect(toCents('0.10') + toCents('0.20')).toBe(30)
  })
})

describe('centsToAmount', () => {
  it('writes cents as a two-decimal amount', () => {
    expect(centsToAmount(1250)).toBe('12.50')
    expect(centsToAmount(5)).toBe('0.05')
    expect(centsToAmount(0)).toBe('0.00')
    expect(centsToAmount(123456)).toBe('1234.56')
  })
})

describe('estimateTaxCents', () => {
  it('matches the backend on its own examples', () => {
    expect(estimateTaxCents(3100, '10.00')).toBe(310) // 31.00 at 10 % is 3.10
    expect(estimateTaxCents(105, '10.00')).toBe(11) // 1.05 at 10 % is 0.105, rounded half up to 0.11
    expect(estimateTaxCents(2500, '10.00')).toBe(250)
  })

  it('handles fractional rates', () => {
    expect(estimateTaxCents(10000, '18.50')).toBe(1850)
    expect(estimateTaxCents(999, '7.25')).toBe(72) // 72.4275 cents
  })

  it('is zero without a usable rate', () => {
    expect(estimateTaxCents(3100, '0.00')).toBe(0)
    expect(estimateTaxCents(3100, null)).toBe(0)
    expect(estimateTaxCents(3100, 'abc')).toBe(0)
  })
})
