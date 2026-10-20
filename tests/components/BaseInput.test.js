import { describe, expect, it } from 'vitest'
import BaseInput from '@/components/common/BaseInput.vue'
import { mountWithApp } from '../helpers/mount'

function field(props = {}) {
  return mountWithApp(BaseInput, { props: { label: 'Email address', ...props } })
}

describe('BaseInput', () => {
  it('ties the label to the input', () => {
    const wrapper = field()

    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label').text()).toContain('Email address')
  })

  it('works with v-model', async () => {
    const wrapper = field({ modelValue: 'a@b.c' })

    expect(wrapper.get('input').element.value).toBe('a@b.c')
    await wrapper.get('input').setValue('new@b.c')

    expect(wrapper.emitted('update:modelValue')).toEqual([['new@b.c']])
  })

  it('gives every field its own id', () => {
    const first = field().get('input').attributes('id')
    const second = field().get('input').attributes('id')

    expect(first).not.toBe(second)
  })

  it('flags an error to assistive technology and links the message', () => {
    const wrapper = field({ error: 'Required.' })

    const input = wrapper.get('input')
    const message = wrapper.get('.field__error')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(message.attributes('id'))
    expect(message.text()).toBe('Required.')
  })

  it('links a hint, and swaps it for the error when there is one', async () => {
    const wrapper = field({ hint: 'We never share it.' })

    expect(wrapper.get('input').attributes('aria-describedby')).toBe(wrapper.get('.field__hint').attributes('id'))
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()

    await wrapper.setProps({ error: 'Invalid.' })

    expect(wrapper.find('.field__hint').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(wrapper.get('.field__error').attributes('id'))
  })

  it('marks required and optional fields', () => {
    expect(field({ required: true }).get('input').attributes('required')).toBeDefined()
    expect(field({ showOptional: true }).text()).toContain('optional')
  })

  it('reveals and hides a password', async () => {
    const wrapper = field({ type: 'password' })
    const toggle = wrapper.get('.field__toggle')

    expect(wrapper.get('input').attributes('type')).toBe('password')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.text()).toBe('Show')

    await toggle.trigger('click')

    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(toggle.text()).toBe('Hide')
  })

  it('offers no reveal button on other fields', () => {
    expect(field({ type: 'email' }).find('.field__toggle').exists()).toBe(false)
  })

  it('passes browser hints through', () => {
    const wrapper = field({ autocomplete: 'email', inputmode: 'email', name: 'email' })

    const input = wrapper.get('input')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('inputmode')).toBe('email')
    expect(input.attributes('name')).toBe('email')
  })
})
