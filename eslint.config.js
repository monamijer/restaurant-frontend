import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

// Composition API building blocks that must never appear: the project is Options API only.
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
      // Options API only: <script setup> and setup() are errors.
      'vue/component-api-style': ['error', ['options']],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              importNames: COMPOSITION_API,
              message: 'This project uses the Options API only (see docs/decisions/001).',
            },
          ],
        },
      ],
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
      'vue/require-default-prop': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/no-v-html': 'error', // User text must never be injected as HTML (XSS).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
