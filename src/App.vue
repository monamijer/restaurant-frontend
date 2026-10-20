<template>
  <StyleguideView />
  <ToastHost />
</template>

<script>
import ToastHost from '@/components/common/ToastHost.vue'
import StyleguideView from '@/views/dev/StyleguideView.vue'

// Temporary: the application shell (layouts and router) replaces this in step 6.4.
export default {
  name: 'App',
  components: { StyleguideView, ToastHost },
}
</script>
