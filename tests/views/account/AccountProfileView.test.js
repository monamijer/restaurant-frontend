import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AccountProfileView from '../../../src/views/account/AccountProfileView.vue'
import { authService } from '../../../src/services/authService'

describe('AccountProfileView', () => {
  it('pre-fills the profile from the store', async () => {
    const { wrapper } = await mountAt(AccountProfileView, '/account/profile', { user: USERS.client })
    await flushPromises()
    expect(wrapper.find('input[name="first_name"]').element.value).toBe('Ada')
    expect(wrapper.find('input[name="last_name"]').element.value).toBe('Lovelace')
  })

  it('PATCHes the profile and shows the saved toast', async () => {
    vi.spyOn(authService, 'updateMe').mockResolvedValue({ ...USERS.client, first_name: 'Ada2' })
    const { wrapper } = await mountAt(AccountProfileView, '/account/profile', { user: USERS.client })
    await flushPromises()
    await wrapper.find('input[name="first_name"]').setValue('Ada2')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(authService.updateMe).toHaveBeenCalledWith({
      first_name: 'Ada2', last_name: 'Lovelace', phone: '', address: '',
    })
  })

  it('refuses an empty first name', async () => {
    vi.spyOn(authService, 'updateMe').mockResolvedValue(USERS.client)
    const { wrapper } = await mountAt(AccountProfileView, '/account/profile', { user: USERS.client })
    await flushPromises()
    await wrapper.find('input[name="first_name"]').setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(authService.updateMe).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('A first name is required.')
  })
})
