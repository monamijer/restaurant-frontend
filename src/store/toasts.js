import { defineStore } from 'pinia'

const DEFAULT_DURATION_MS = 4500
const ERROR_DURATION_MS = 7000
const MAX_VISIBLE = 4

let nextId = 1

/** Short messages that disappear by themselves. Errors stay a little longer. */
export const useToastStore = defineStore('toasts', {
  state: () => ({ items: [] }),

  actions: {
    push(type, message, duration = DEFAULT_DURATION_MS) {
      const id = nextId++
      this.items.push({ id, type, message })
      if (this.items.length > MAX_VISIBLE) this.items.shift()
      if (duration > 0) setTimeout(() => this.dismiss(id), duration)
      return id
    },

    success(message) {
      return this.push('success', message)
    },

    info(message) {
      return this.push('info', message)
    },

    error(message) {
      return this.push('error', message, ERROR_DURATION_MS)
    },

    dismiss(id) {
      this.items = this.items.filter((toast) => toast.id !== id)
    },
  },
})
