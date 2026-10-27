import { defineStore } from 'pinia'
import { settingsService } from '@/services/settingsService'
import { formatClock } from '@/utils/format'

const FALLBACK_NAME = 'Restaurant'

/** The public configuration of the restaurant: its name and opening hours. */
export const useRestaurantStore = defineStore('restaurant', {
  state: () => ({
    settings: null,
    loading: false,
    failed: false,
  }),

  getters: {
    name: (state) => state.settings?.name || FALLBACK_NAME,
    opensAt: (state) => formatClock(state.settings?.opening_time),
    closesAt: (state) => formatClock(state.settings?.closing_time),
    hasHours: (state) => Boolean(state.settings?.opening_time && state.settings?.closing_time),
  },

  actions: {
    async load() {
      this.loading = true
      this.failed = false
      try {
        this.settings = await settingsService.get()
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },
  },
})
