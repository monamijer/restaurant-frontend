import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './assets/styles/tokens.css'
import './assets/styles/base.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { useUiStore } from './store/ui'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

// Apply the saved (or default) theme and language to the page before anything is shown.
useUiStore().init()

app.mount('#app')
