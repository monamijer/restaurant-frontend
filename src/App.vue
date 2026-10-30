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
import { useRestaurantStore } from '@/store/restaurant'
import { useUiStore } from '@/store/ui'

const LAYOUTS = { main: MainLayout, auth: AuthLayout }

export default {
  name: 'App',
  components: { ToastHost },
  computed: {
    ...mapState(useUiStore, ['locale']),
    ...mapState(useRestaurantStore, { restaurantName: 'name' }),
    layout() {
      return LAYOUTS[this.$route.meta.layout] ?? MainLayout
    },
  },
  watch: {
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
