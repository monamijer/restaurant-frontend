import { describe, it, expect } from 'vitest'
import { mountAt } from '../helpers/app'
import HomeView from '../../src/views/HomeView.vue'

describe('HomeView (landing)', () => {
  it('renders the hero carousel with the three slides', async () => {
    const { wrapper } = await mountAt(HomeView, '/')
    const slides = wrapper.findAll('.hero__slide')
    expect(slides).toHaveLength(3)
    expect(wrapper.text()).toContain('A table, whenever you want')
  })

  it('advances the carousel with the next arrow', async () => {
    const { wrapper } = await mountAt(HomeView, '/')
    const next = wrapper.find('.hero__controls button[aria-label="Next slide"]')
    await next.trigger('click')
    expect(wrapper.text()).toContain('Order from the menu, pay in a tap')
  })

  it('renders the three steps and the closing call to action', async () => {
    const { wrapper } = await mountAt(HomeView, '/')
    const steps = wrapper.findAll('.step')
    expect(steps).toHaveLength(3)
    expect(wrapper.text()).toContain('Pick your dishes')
    expect(wrapper.text()).toContain('Order and pay')
    expect(wrapper.text()).toContain('Follow the kitchen')
    expect(wrapper.text()).toContain('Hungry already?')
  })

  it('does not expose the technical stack or the demo accounts on the public page', async () => {
    const { wrapper } = await mountAt(HomeView, '/')
    const text = wrapper.text()
    expect(text).not.toContain('Vue 3')
    expect(text).not.toContain('admin@demo.example')
    expect(text).not.toContain('Demo-Passw0rd!')
  })
})
