import { defineStore } from 'pinia'
import { tableService } from '@/services/tableService'

export const TABLE_KEY = 'restaurant.table'

function readStored() {
  try {
    const table = JSON.parse(window.sessionStorage.getItem(TABLE_KEY) ?? 'null')
    const valid =
      table &&
      typeof table.token === 'string' &&
      table.token.length > 0 &&
      Number.isInteger(table.id) &&
      Number.isInteger(table.number)
    return valid ? { token: table.token, id: table.id, number: table.number } : null
  } catch {
    return null
  }
}

function writeStored(table) {
  try {
    if (table) window.sessionStorage.setItem(TABLE_KEY, JSON.stringify(table))
    else window.sessionStorage.removeItem(TABLE_KEY)
  } catch {
    // The table is still remembered for the current page.
  }
}

/**
 * The table a diner is sitting at, learned by scanning its QR code. It is kept for this browser
 * tab only (sessionStorage): closing the tab ends the visit. The token proves presence to the
 * backend when a dine-in order is placed.
 */
export const useTableStore = defineStore('table', {
  state: () => ({ table: readStored() }),

  getters: {
    isSeated: (state) => state.table !== null,
    number: (state) => state.table?.number ?? null,
    token: (state) => state.table?.token ?? '',
  },

  actions: {
    /** Ask the backend which table a token designates and remember it. Throws if it is refused. */
    async scan(token) {
      const resolved = await tableService.resolveQr(token)
      this.table = { token, id: resolved.id, number: resolved.number }
      writeStored(this.table)
      return this.table
    },

    clear() {
      this.table = null
      writeStored(null)
    },
  },
})
