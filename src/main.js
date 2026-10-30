import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './assets/styles/tokens.css'
import './assets/styles/base.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { i18n, translate } from './i18n'
import { createAppRouter } from './router'
import { sessionExpiredHandler } from './router/expiry'
import { configureApi } from './services/api'
import { useToastStore } from './store/toasts'
import { useUiStore } from './store/ui'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

// Apply the saved (or default) theme and language to the page before anything is shown.
useUiStore().init()

const router = createAppRouter(createWebHistory())
configureApi({ onSessionExpired: sessionExpiredHandler(router) })
app.use(router)

app.config.errorHandler = (error) => {
  console.error(error)
  useToastStore().error(translate('errors.unexpected'))
}

app.mount('#app')
