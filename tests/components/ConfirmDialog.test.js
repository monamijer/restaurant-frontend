import { describe, expect, it } from 'vitest'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { mountWithApp } from '../helpers/mount'

function confirmation(props = {}) {
  return mountWithApp(ConfirmDialog, {
    props: { open: true, title: 'Cancel it?', message: 'This cannot be undone.', ...props },
    attachTo: document.body,
  })
}

describe('ConfirmDialog', () => {
  it('shows the question and both answers', () => {
    const wrapper = confirmation()

    expect(wrapper.text()).toContain('This cannot be undone.')
    expect(wrapper.findAll('footer button').map((button) => button.text())).toEqual(['Cancel', 'Confirm'])
  })

  it('uses the labels it is given', () => {
    const wrapper = confirmation({ confirmLabel: 'Yes, cancel', cancelLabel: 'Keep it' })

    expect(wrapper.findAll('footer button').map((button) => button.text())).toEqual(['Keep it', 'Yes, cancel'])
  })

  it('emits confirm and cancel', async () => {
    const wrapper = confirmation()
    const [cancel, confirm] = wrapper.findAll('footer button')

    await confirm.trigger('click')
    await cancel.trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('puts the initial focus on the harmless answer', () => {
    const wrapper = confirmation({ danger: true })

    const [cancel] = wrapper.findAll('footer button')
    expect(cancel.attributes('autofocus')).toBeDefined()
  })

  it('styles a destructive confirmation as dangerous', () => {
    const wrapper = confirmation({ danger: true })

    expect(wrapper.findAll('footer button')[1].classes()).toContain('btn--danger')
  })

  it('locks the answers while it works', () => {
    const wrapper = confirmation({ loading: true })

    const [cancel, confirm] = wrapper.findAll('footer button')
    expect(cancel.attributes('disabled')).toBeDefined()
    expect(confirm.attributes('aria-busy')).toBe('true')
  })

  it('reports a dismissal (Escape or backdrop) as a cancellation', async () => {
    const wrapper = confirmation()

    await wrapper.get('.modal__close').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
