import { describe, it, expect } from 'vitest'
import { mountAt } from '../helpers/app'
import AppFooter from '../../src/components/layout/AppFooter.vue'
import { useRestaurantStore } from '../../src/store/restaurant'

describe('AppFooter', () => {
  it('shows the four columns, the legal links and the social links', async () => {
    const { wrapper } = await mountAt(AppFooter, '/', {
      before: () => { useRestaurantStore().settings = { name: 'Maisha' } },
    })
    const text = wrapper.text()
    expect(text).toContain('About Maisha')
    expect(text).toContain('Features')
    expect(text).toContain('Help')
    expect(text).toContain('Legal')
    expect(text).toContain('Privacy policy')
    expect(text).toContain('Terms of service')
    expect(text).toContain('Maisha')

    const social = wrapper.findAll('a[target="_blank"]')
    const hrefs = social.map((a) => a.attributes('href'))
    expect(hrefs.some((h) => h && h.includes('github.com/monamijer'))).toBe(true)
    expect(hrefs.some((h) => h && h.includes('linkedin.com'))).toBe(true)
    expect(hrefs.some((h) => h && h.includes('x.com/JeromeMonami'))).toBe(true)
    expect(hrefs.some((h) => h && h.includes('instagram.com/monamijerome'))).toBe(true)
  })

  it('falls back to the generic hours text when the settings are not loaded', async () => {
    const { wrapper } = await mountAt(AppFooter, '/')
    expect(wrapper.text()).toContain('Opening hours are not available right now.')
  })

  it('shows the opening hours when the settings are loaded', async () => {
    const { wrapper } = await mountAt(AppFooter, '/', {
      before: () => {
        useRestaurantStore().settings = { name: 'Maisha', opening_time: '10:00:00', closing_time: '23:30:00' }
      },
    })
    expect(wrapper.text()).toContain('Every day, 10:00 to 23:30')
    expect(wrapper.text()).toContain('Maisha')
  })
})
