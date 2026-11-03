// What the interface needs to know about order statuses. The backend owns the rules.

export const ORDER_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

const TONES = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

export function orderStatusTone(status) {
  return TONES[status] ?? 'neutral'
}

/** An order that will not change any more. */
export function isFinished(status) {
  return status === 'completed' || status === 'cancelled'
}

export const PAYMENT_TONES = { pending: 'warning', paid: 'success', failed: 'danger', refunded: 'neutral' }
