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

/** "2026-10-12", a calendar date with no time zone, as a readable day. */
export function formatDay(day, locale = 'en') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) return ''
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))
}

/** Today's date (YYYY-MM-DD) in the restaurant's time zone, which may differ from the visitor's. */
export function todayIn(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** "09:00:00" becomes "09:00". */
export function formatClock(timeString) {
  return typeof timeString === 'string' ? timeString.slice(0, 5) : ''
}
