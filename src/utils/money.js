// Money in the cart is handled as whole cents, never as floating-point euros or dollars, so
// sums are exact. These are only estimates for display: the backend computes the real prices.

/** "12.50" becomes 1250. Anything that is not a plain amount becomes 0. */
export function toCents(amount) {
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(String(amount).trim())
  if (!match) return 0
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
}

/** 1250 becomes "12.50". */
export function centsToAmount(cents) {
  return (cents / 100).toFixed(2)
}

/**
 * Tax on a subtotal, rounded half up to the cent exactly like the backend.
 * `rate` is a percentage with at most two decimals, for example "10.00".
 */
export function estimateTaxCents(subtotalCents, rate) {
  const hundredths = Math.round(Number(rate) * 100) // 10.00 % is 1000 hundredths of a percent
  if (!Number.isFinite(hundredths) || hundredths <= 0) return 0
  return Math.floor((subtotalCents * hundredths + 5000) / 10000)
}
