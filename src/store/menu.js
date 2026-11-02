import { defineStore } from 'pinia'
import { menuService } from '@/services/menuService'

/** The categories: a small set every menu page needs, loaded once. */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    categories: [],
    loaded: false,
    failed: false,
  }),

  actions: {
    async loadCategories() {
      if (this.loaded) return
      this.failed = false
      try {
        this.categories = await menuService.categories()
        this.loaded = true
      } catch {
        this.failed = true // The dishes still show; only the category buttons are missing.
      }
    },
  },
})
