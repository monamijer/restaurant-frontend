// What the interface needs to know about reservations and the queue. The backend owns the rules.

export const MAX_PARTY_SIZE = 20
export const MAX_RESERVATION_NOTES = 500

const RESERVATION_TONES = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  completed: 'neutral',
  no_show: 'danger',
}

export function reservationTone(status) {
  return RESERVATION_TONES[status] ?? 'neutral'
}

/** A customer may cancel a request or a confirmed booking, nothing else. */
export function canCancelReservation(status) {
  return status === 'pending' || status === 'confirmed'
}

/** The durations offered, from the restaurant's minimum to its maximum in steps of the slot grid. */
export function durationOptions(settings) {
  const min = Number(settings?.min_reservation_minutes)
  const max = Number(settings?.max_reservation_minutes)
  const step = Number(settings?.slot_step_minutes)
  if (![min, max, step].every((value) => Number.isInteger(value) && value > 0) || max < min) return [60, 90, 120]

  const options = []
  for (let minutes = min; minutes <= max && options.length < 12; minutes += step) options.push(minutes)
  return options
}

/** The smallest table that fits: keeps the larger ones free for larger parties. */
export function smallestTable(tables) {
  return [...tables].sort((a, b) => a.capacity - b.capacity || a.number - b.number)[0] ?? null
}

const QUEUE_TONES = { waiting: 'warning', called: 'success', seated: 'neutral', cancelled: 'neutral', no_show: 'danger' }

export function queueTone(status) {
  return QUEUE_TONES[status] ?? 'neutral'
}

export function isActiveTicket(status) {
  return status === 'waiting' || status === 'called'
}
