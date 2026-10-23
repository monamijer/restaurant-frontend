import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

const COMPOSITION_API = [
  'ref', 'reactive', 'computed', 'watch', 'watchEffect', 'toRef', 'toRefs', 'shallowRef',
  'shallowReactive', 'readonly', 'onBeforeMount', 'onMounted', 'onBeforeUpdate', 'onUpdated',
  'onBeforeUnmount', 'onUnmounted', 'provide', 'inject', 'useSlots', 'useAttrs',
]

export default [
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'vue/component-api-style': ['error', ['options']],
      'no-restricted-imports': ['error', { paths: [{ name: 'vue', importNames: COMPOSITION_API, message: 'Options API only.' }] }],
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
      'vue/require-default-prop': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/no-v-html': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['tests/**/*.js', '*.config.js'], languageOptions: { globals: { ...globals.node } } },
]
