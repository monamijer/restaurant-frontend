import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { ROLES, STAFF_ROLES } from '@/utils/roles'

// One in-flight restore, shared by every caller (the router guard runs on each navigation).
let restoring = null

/**
 * The signed-in user. The backend is the authority on who may do what: `role` here only
 * decides which links and pages are offered.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    restored: false, // True once the stored session (if any) has been checked.
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    role: (state) => state.user?.role ?? null,
    isStaff: (state) => STAFF_ROLES.includes(state.user?.role),
    isAdmin: (state) => state.user?.role === ROLES.ADMIN,
    fullName: (state) => (state.user ? `${state.user.first_name} ${state.user.last_name}`.trim() : ''),
  },

  actions: {
    /** Re-open the session that survived a page reload, if there is one. Safe to call often. */
    async restoreSession() {
      if (this.restored) return
      // The reset runs in a later microtask, after the promise has been stored.
      restoring ??= this.runRestore().finally(() => {
        restoring = null
      })
      await restoring
    },

    async runRestore() {
      try {
        if (session.getRefreshToken()) {
          await authService.refreshSession()
          this.user = await authService.me()
        }
      } catch {
        session.clear()
        this.user = null
      } finally {
        this.restored = true
      }
    },

    async login(credentials) {
      this.user = await authService.login(credentials)
      this.restored = true
      return this.user
    },

    /** Create the account, then sign the new customer straight in. */
    async register(payload) {
      await authService.register(payload)
      return this.login({ email: payload.email, password: payload.password })
    },

    async logout() {
      await authService.logout()
      this.user = null
    },

    /** The session cannot be renewed any more: forget it locally. */
    expireSession() {
      session.clear()
      this.user = null
      this.restored = true
    },

    async refreshUser() {
      this.user = await authService.me()
      return this.user
    },

    /** Update the signed-in profile through the API and keep the store in sync. */
    async updateProfile(changes) {
      this.user = await authService.updateMe(changes)
      return this.user
    },

    /**
     * Change the signed-in password. The backend rotates the tokens and signs out every
     * other session; refresh the profile so the store never lags behind.
     */
    async changePassword({ oldPassword, newPassword }) {
      await authService.changePassword({ oldPassword, newPassword })
      return this.refreshUser()
    },
  },
})
