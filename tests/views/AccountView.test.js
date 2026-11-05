import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../helpers/app'
import AccountView from '../../src/views/AccountView.vue'

describe('AccountView', () => {
  it('shows the account navigation, which links to the profile and the password pages', async () => {
    const { wrapper } = await mountAt(AccountView, '/client/account', { user: USERS.client })
    await flushPromises()
    const nav = wrapper.get('nav.account-nav')
    const hrefs = nav.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/account/profile')
    expect(hrefs).toContain('/account/password')
  })
})
