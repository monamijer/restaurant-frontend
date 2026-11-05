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

  it('renders the three spaces, the stack and the demo accounts', async () => {
    const { wrapper } = await mountAt(HomeView, '/')
    expect(wrapper.text()).toContain('For customers')
    expect(wrapper.text()).toContain('For the floor')
    expect(wrapper.text()).toContain('For the office')
    expect(wrapper.text()).toContain('Vue 3')
    expect(wrapper.text()).toContain('admin@demo.example')
  })
})
