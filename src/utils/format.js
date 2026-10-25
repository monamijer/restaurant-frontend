// Display formatting. Amounts arrive from the API as exact decimal strings and are never
// computed on here: they are only formatted for display.

export function formatMoney(amount, currency = 'USD', locale = 'en') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatDateTime(isoString, locale = 'en', timeZone) {
  if (!isoString) return ''
  const options = { dateStyle: 'medium', timeStyle: 'short' }
  if (timeZone) options.timeZone = timeZone
  return new Intl.DateTimeFormat(locale, options).format(new Date(isoString))
}

/** "09:00:00" becomes "09:00". */
export function formatClock(timeString) {
  return typeof timeString === 'string' ? timeString.slice(0, 5) : ''
}
