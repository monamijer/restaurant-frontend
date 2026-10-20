import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseButton from '@/components/common/BaseButton.vue'

describe('BaseButton', () => {
  it('renders a button that never submits a form by accident', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Save' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Save')
  })

  it('can be a submit button', () => {
    const wrapper = mount(BaseButton, { props: { type: 'submit' } })

    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('applies the variant and size', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'danger', size: 'lg', block: true } })

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['btn--danger', 'btn--lg', 'btn--block']))
  })

  it('is disabled and announced as busy while loading', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      global: { mocks: { $t: (key) => key } },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('does not look busy when idle', () => {
    const wrapper = mount(BaseButton)

    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('emits clicks, except when disabled', async () => {
    const enabled = mount(BaseButton)
    const disabled = mount(BaseButton, { props: { disabled: true } })

    await enabled.trigger('click')
    await disabled.trigger('click')

    expect(enabled.emitted('click')).toHaveLength(1)
    expect(disabled.emitted('click')).toBeUndefined()
  })

  it('becomes a link when it navigates', () => {
    const wrapper = mount(BaseButton, {
      props: { to: { name: 'home' } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'home' })
    expect(wrapper.attributes('type')).toBeUndefined()
  })
})
