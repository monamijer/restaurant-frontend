import { describe, expect, it } from 'vitest'
import BaseModal from '@/components/common/BaseModal.vue'
import { mountWithApp } from '../helpers/mount'

function modal(props = {}, slots = {}) {
  return mountWithApp(BaseModal, {
    props: { title: 'Dialog title', ...props },
    slots: { default: '<p>Body</p>', ...slots },
    attachTo: document.body,
  })
}

describe('BaseModal', () => {
  it('stays closed until asked to open', () => {
    const wrapper = modal()

    expect(wrapper.get('dialog').element.open).toBe(false)
  })

  it('opens and closes with its open prop', async () => {
    const wrapper = modal()

    await wrapper.setProps({ open: true })
    expect(wrapper.get('dialog').element.open).toBe(true)

    await wrapper.setProps({ open: false })
    expect(wrapper.get('dialog').element.open).toBe(false)
  })

  it('opens at once when it is mounted open', () => {
    expect(modal({ open: true }).get('dialog').element.open).toBe(true)
  })

  it('is named by its title', () => {
    const wrapper = modal()

    const title = wrapper.get('h2')
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(title.text()).toBe('Dialog title')
  })

  it('asks to be closed when the close button is used', async () => {
    const wrapper = modal({ open: true })

    await wrapper.get('.modal__close').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when the backdrop is clicked, not when the panel is', async () => {
    const wrapper = modal({ open: true })

    await wrapper.get('.modal__panel').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('dialog').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('cannot be dismissed when it is not closable', async () => {
    const wrapper = modal({ open: true, closable: false })

    expect(wrapper.find('.modal__close').exists()).toBe(false)
    const escape = new Event('cancel', { cancelable: true })
    wrapper.get('dialog').element.dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(true)

    await wrapper.get('dialog').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('lets Escape close a closable dialog', () => {
    const wrapper = modal({ open: true })

    const escape = new Event('cancel', { cancelable: true })
    wrapper.get('dialog').element.dispatchEvent(escape)

    expect(escape.defaultPrevented).toBe(false)
  })

  it('renders its footer only when one is given', () => {
    expect(modal().find('.modal__footer').exists()).toBe(false)
    expect(modal({}, { footer: '<button>OK</button>' }).find('.modal__footer').exists()).toBe(true)
  })
})
