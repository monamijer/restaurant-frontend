import { describe, expect, it } from 'vitest'
import ToastHost from '@/components/common/ToastHost.vue'
import { useToastStore } from '@/store/toasts'
import { mountWithApp } from '../helpers/mount'

function host() {
  const wrapper = mountWithApp(ToastHost, { global: { stubs: { transition: false, 'transition-group': false } } })
  return { wrapper, toasts: useToastStore() }
}

describe('ToastHost', () => {
  it('shows each message with the right live-region role', async () => {
    const { wrapper, toasts } = host()

    toasts.success('Saved')
    toasts.error('Failed')
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('li')
    expect(items.map((item) => item.text().replace('×', '').trim())).toEqual(['Saved', 'Failed'])
    expect(items.map((item) => item.attributes('role'))).toEqual(['status', 'alert'])
  })

  it('dismisses a message with its close button', async () => {
    const { wrapper, toasts } = host()
    toasts.info('Heads up')
    await wrapper.vm.$nextTick()

    await wrapper.get('button').trigger('click')

    expect(toasts.items).toEqual([])
  })

  it('labels the close button for screen readers', async () => {
    const { wrapper, toasts } = host()
    toasts.info('Heads up')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('aria-label')).toBe('Dismiss notification')
  })
})
