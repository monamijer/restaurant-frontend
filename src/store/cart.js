import { defineStore } from 'pinia'
import { MAX_CART_LINES, MAX_LINE_QUANTITY, MAX_NOTE_LENGTH } from '@/config'
import { centsToAmount, toCents } from '@/utils/money'

export const CART_KEY = 'restaurant.cart'

const PRICE_PATTERN = /^\d{1,6}(\.\d{1,2})?$/

/** A stored line is trusted only after every field is checked: the storage can be edited by hand. */
function cleanLine(line) {
  if (!line || typeof line !== 'object') return null
  const { id, name, price, image, quantity, note } = line
  if (!Number.isInteger(id) || id < 1) return null
  if (typeof name !== 'string' || name === '' || name.length > 200) return null
  if (typeof price !== 'string' || !PRICE_PATTERN.test(price)) return null
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return null
  return {
    id,
    name,
    price,
    image: typeof image === 'string' && /^https?:\/\//.test(image) ? image : null,
    quantity,
    note: typeof note === 'string' ? note.slice(0, MAX_NOTE_LENGTH) : '',
  }
}

function readStored() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY) ?? 'null')
    const lines = []
    for (const candidate of Array.isArray(stored?.lines) ? stored.lines : []) {
      const line = cleanLine(candidate)
      if (line && !lines.some((existing) => existing.id === line.id)) lines.push(line)
    }
    return lines.slice(0, MAX_CART_LINES)
  } catch {
    return []
  }
}

function writeStored(lines) {
  try {
    if (lines.length === 0) window.localStorage.removeItem(CART_KEY)
    else window.localStorage.setItem(CART_KEY, JSON.stringify({ v: 1, lines }))
  } catch {
    // The cart still works for this visit when storage is unavailable.
  }
}

/**
 * The shopping cart. It lives in the browser until the order is placed. Names and prices are a
 * snapshot for display only: the backend recomputes every price when the order is created.
 */
export const useCartStore = defineStore('cart', {
  state: () => ({ lines: readStored() }),

  getters: {
    count: (state) => state.lines.reduce((total, line) => total + line.quantity, 0),
    isEmpty: (state) => state.lines.length === 0,
    quantityOf: (state) => (id) => state.lines.find((line) => line.id === id)?.quantity ?? 0,
    lineTotal: () => (line) => centsToAmount(toCents(line.price) * line.quantity),
    subtotalCents: (state) => state.lines.reduce((sum, line) => sum + toCents(line.price) * line.quantity, 0),
    subtotal() {
      return centsToAmount(this.subtotalCents)
    },
    /** The lines in the shape the order endpoint expects. */
    orderItems: (state) =>
      state.lines.map((line) => ({
        menu_item: line.id,
        quantity: line.quantity,
        special_instructions: line.note.trim(),
      })),
  },

  actions: {
    /** Add `quantity` of a dish. Returns 'added', 'unavailable' or 'limit'. */
    add(item, quantity = 1) {
      const existing = this.lines.find((line) => line.id === item.id)
      if (existing) {
        if (existing.quantity + quantity > MAX_LINE_QUANTITY) return 'limit'
        existing.quantity += quantity
      } else {
        if (!item.is_available) return 'unavailable'
        if (this.lines.length >= MAX_CART_LINES || quantity > MAX_LINE_QUANTITY) return 'limit'
        this.lines.push({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image ?? null,
          quantity,
          note: '',
        })
      }
      this.persist()
      return 'added'
    },

    setQuantity(id, quantity) {
      const line = this.lines.find((candidate) => candidate.id === id)
      if (!line) return
      if (!Number.isInteger(quantity) || quantity < 1) return this.remove(id)
      line.quantity = Math.min(quantity, MAX_LINE_QUANTITY)
      this.persist()
    },

    setNote(id, note) {
      const line = this.lines.find((candidate) => candidate.id === id)
      if (!line) return
      line.note = String(note).slice(0, MAX_NOTE_LENGTH)
      this.persist()
    },

    remove(id) {
      this.lines = this.lines.filter((line) => line.id !== id)
      this.persist()
    },

    clear() {
      this.lines = []
      this.persist()
    },

    /** Another tab changed the cart: follow it. */
    reload() {
      this.lines = readStored()
    },

    persist() {
      writeStored(this.lines)
    },
  },
})
