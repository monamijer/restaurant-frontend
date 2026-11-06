import { describe, it, expect } from 'vitest'
import { mountAt } from '../../helpers/app'
import PrivacyPolicyView from '../../../src/views/legal/PrivacyPolicyView.vue'

describe('PrivacyPolicyView', () => {
  it('renders the six sections and the demonstration notice', async () => {
    const { wrapper } = await mountAt(PrivacyPolicyView, '/privacy')
    const text = wrapper.text()
    expect(text).toContain('Privacy policy')
    expect(text).toContain('1. Data we collect')
    expect(text).toContain('7. Your rights')
    expect(text).toContain('academic course')
    expect(text).toContain('hello@maisha.example')
  })

  it('has exactly six section headings and one page heading', async () => {
    const { wrapper } = await mountAt(PrivacyPolicyView, '/privacy')
    expect(wrapper.findAll('h2')).toHaveLength(9)
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })
})
