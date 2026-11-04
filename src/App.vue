<template>
  <component :is="layout" />
  <ToastHost />
</template>

<script>
import { mapActions, mapState } from 'pinia'
import ToastHost from '@/components/common/ToastHost.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { applyDocumentTitle } from '@/router/title'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import { useRestaurantStore } from '@/store/restaurant'
import { useUiStore } from '@/store/ui'

const LAYOUTS = { main: MainLayout, auth: AuthLayout }

export default {
  name: 'App',
  components: { ToastHost },
  computed: {
    ...mapState(useUiStore, ['locale']),
    ...mapState(useAuthStore, ['isAuthenticated']),
    ...mapState(useRestaurantStore, { restaurantName: 'name' }),
    layout() {
      return LAYOUTS[this.$route.meta.layout] ?? MainLayout
    },
  },
  watch: {
    // Notifications are polled only for a signed-in user, and forgotten at sign out.
    isAuthenticated: {
      immediate: true,
      handler(signedIn) {
        const notifications = useNotificationStore()
        if (signedIn) notifications.startPolling()
        else notifications.reset()
      },
    },
    // The tab title follows the language and the restaurant name.
    locale() {
      applyDocumentTitle(this.$route)
    },
    restaurantName() {
      applyDocumentTitle(this.$route)
    },
  },
  created() {
    this.loadRestaurant()
  },
  methods: {
    ...mapActions(useRestaurantStore, { loadRestaurant: 'load' }),
  },
}
</script>
