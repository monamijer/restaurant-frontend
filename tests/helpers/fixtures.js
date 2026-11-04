/** An order as the backend returns it. */
export function makeOrder(overrides = {}) {
  return {
    id: 42,
    customer: 1,
    customer_name: 'Ada Lovelace',
    order_type: 'dine_in',
    status: 'pending',
    table: 5,
    table_number: 5,
    delivery_address: '',
    contact_phone: '',
    notes: '',
    items: [
      {
        id: 1,
        menu_item: 7,
        item_name: 'Grilled fish',
        quantity: 2,
        unit_price: '12.50',
        subtotal: '25.00',
        special_instructions: 'well done',
      },
      { id: 2, menu_item: 8, item_name: 'Fries', quantity: 1, unit_price: '6.00', subtotal: '6.00', special_instructions: '' },
    ],
    subtotal: '31.00',
    tax_rate: '10.00',
    tax_amount: '3.10',
    total: '34.10',
    currency: 'USD',
    created_at: '2026-10-10T17:00:00Z',
    updated_at: '2026-10-10T17:00:00Z',
    ...overrides,
  }
}

export function makePayment(overrides = {}) {
  return {
    id: 9,
    order: 42,
    method: 'card',
    amount: '34.10',
    status: 'paid',
    reference: 'PAY-AB12CD34',
    paid_at: '2026-10-10T17:05:00Z',
    created_at: '2026-10-10T17:04:00Z',
    currency: 'USD',
    ...overrides,
  }
}

export const page = (results, count = results.length) => ({ count, next: null, previous: null, results })

export const SETTINGS = {
  name: 'Chez Test',
  timezone: 'UTC',
  tax_rate: '10.00',
  opening_time: '09:00:00',
  closing_time: '22:00:00',
  min_reservation_minutes: 60,
  max_reservation_minutes: 180,
  slot_step_minutes: 30,
}

export function makeReservation(overrides = {}) {
  return {
    id: 5,
    customer: 1,
    table: 3,
    table_number: 3,
    date: '2026-10-10',
    time: '19:00',
    starts_at: '2026-10-10T19:00:00Z',
    ends_at: '2026-10-10T20:30:00Z',
    duration_minutes: 90,
    party_size: 4,
    status: 'confirmed',
    notes: '',
    expires_at: null,
    ...overrides,
  }
}

export function makeTicket(overrides = {}) {
  return {
    id: 4,
    party_size: 2,
    phone: '',
    status: 'waiting',
    position: 3,
    estimated_wait_minutes: 20,
    quoted_wait_minutes: 25,
    created_at: '2026-10-10T17:00:00Z',
    ...overrides,
  }
}

export function makeInvoice(overrides = {}) {
  return {
    id: 1,
    order: 42,
    invoice_number: 'INV-2026-000001',
    total: '34.10',
    currency: 'USD',
    issued_at: '2026-10-10T17:06:00Z',
    ...overrides,
  }
}
