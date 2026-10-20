import { describe, expect, it } from 'vitest'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { mountWithApp } from '../helpers/mount'

describe('BaseSpinner', () => {
  it('announces itself politely to screen readers', () => {
    const wrapper = mountWithApp(BaseSpinner)

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toBe('Loading…')
  })

  it('stays silent when it is only decoration', () => {
    const wrapper = mountWithApp(BaseSpinner, { props: { decorative: true } })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.text()).toBe('')
  })
})

describe('BaseSkeleton', () => {
  it('is hidden from assistive technology and takes the requested size', () => {
    const wrapper = mountWithApp(BaseSkeleton, { props: { width: '40%', height: '2rem' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toContain('width: 40%')
    expect(wrapper.attributes('style')).toContain('height: 2rem')
  })
})

describe('BaseBadge', () => {
  it('shows its text in the requested tone', () => {
    const wrapper = mountWithApp(BaseBadge, { props: { tone: 'success' }, slots: { default: 'Confirmed' } })

    expect(wrapper.text()).toBe('Confirmed')
    expect(wrapper.classes()).toContain('badge--success')
  })
})

describe('EmptyState', () => {
  it('explains what is missing and offers the way forward', () => {
    const wrapper = mountWithApp(EmptyState, {
      props: { title: 'Nothing yet', description: 'It will appear here.' },
      slots: { default: '<button>Create</button>' },
    })

    expect(wrapper.get('h3').text()).toBe('Nothing yet')
    expect(wrapper.text()).toContain('It will appear here.')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('needs no description or action', () => {
    const wrapper = mountWithApp(EmptyState, { props: { title: 'Nothing yet' } })

    expect(wrapper.find('.empty__actions').exists()).toBe(false)
  })
})
