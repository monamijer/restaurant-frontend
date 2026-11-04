import { defineStore } from 'pinia'
import { notificationService } from '@/services/notificationService'

export const POLL_INTERVAL_MS = 30000

let timer = null

/** The signed-in user's notifications: a badge count kept fresh in the background and a list. */
export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    unread: 0,
    items: [],
    count: 0,
    loading: false,
    failed: false,
  }),

  actions: {
    /** A quiet check: a failure keeps the last known count. */
    async refreshUnread() {
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        this.unread = await notificationService.unreadCount()
      } catch {
        // The next tick tries again.
      }
    },

    startPolling() {
      this.stopPolling()
      this.refreshUnread()
      timer = setInterval(() => this.refreshUnread(), POLL_INTERVAL_MS)
    },

    stopPolling() {
      clearInterval(timer)
      timer = null
    },

    /** Forget everything when someone signs out, so the next person never sees it. */
    reset() {
      this.stopPolling()
      this.unread = 0
      this.items = []
      this.count = 0
    },

    async load(params) {
      this.loading = true
      this.failed = false
      try {
        const page = await notificationService.list(params)
        this.items = page.results
        this.count = page.count
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    async markRead(id) {
      const updated = await notificationService.markRead(id)
      const item = this.items.find((candidate) => candidate.id === id)
      if (item && !item.is_read) this.unread = Math.max(0, this.unread - 1)
      if (item) item.is_read = updated.is_read
    },

    async markAllRead() {
      await notificationService.markAllRead()
      this.items.forEach((item) => (item.is_read = true))
      this.unread = 0
    },
  },
})
