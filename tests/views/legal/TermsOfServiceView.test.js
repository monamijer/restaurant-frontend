import { describe, it, expect } from 'vitest'
import { mountAt } from '../../helpers/app'
import TermsOfServiceView from '../../../src/views/legal/TermsOfServiceView.vue'

describe('TermsOfServiceView', () => {
  it('renders the six sections and the demonstration notice', async () => {
    const { wrapper } = await mountAt(TermsOfServiceView, '/terms')
    const text = wrapper.text()
    expect(text).toContain('Terms of service')
    expect(text).toContain('1. The service')
    expect(text).toContain('6. Applicable law')
    expect(text).toContain('demonstration project')
  })

  it('has exactly six section headings and one page heading', async () => {
    const { wrapper } = await mountAt(TermsOfServiceView, '/terms')
    expect(wrapper.findAll('h2')).toHaveLength(6)
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })
})
