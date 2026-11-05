import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AccountPasswordView from '../../../src/views/account/AccountPasswordView.vue'
import { authService } from '../../../src/services/authService'

function fill(wrapper, { oldPassword = 'old', newPassword = 'new-secret', confirmPassword = newPassword } = {}) {
  return Promise.all([
    wrapper.find('input[name="old_password"]').setValue(oldPassword),
    wrapper.find('input[name="new_password"]').setValue(newPassword),
    wrapper.find('input[name="confirm_password"]').setValue(confirmPassword),
  ])
}

describe('AccountPasswordView', () => {
  it('sends the passwords and refreshes the user', async () => {
    vi.spyOn(authService, 'changePassword').mockResolvedValue(undefined)
    const meSpy = vi.spyOn(authService, 'me').mockResolvedValue(USERS.client)
    const { wrapper } = await mountAt(AccountPasswordView, '/account/password', { user: USERS.client })
    await flushPromises()

    await fill(wrapper)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authService.changePassword).toHaveBeenCalledWith({ oldPassword: 'old', newPassword: 'new-secret' })
    expect(meSpy).toHaveBeenCalled()
  })

  it('refuses a too short password', async () => {
    vi.spyOn(authService, 'changePassword').mockResolvedValue(undefined)
    const { wrapper } = await mountAt(AccountPasswordView, '/account/password', { user: USERS.client })
    await flushPromises()

    await fill(wrapper, { newPassword: 'short', confirmPassword: 'short' })
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('The password must be at least 8 characters long.')
  })

  it('refuses a mismatched confirmation', async () => {
    vi.spyOn(authService, 'changePassword').mockResolvedValue(undefined)
    const { wrapper } = await mountAt(AccountPasswordView, '/account/password', { user: USERS.client })
    await flushPromises()

    await fill(wrapper, { newPassword: 'new-secret', confirmPassword: 'other-secret' })
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('The two passwords do not match.')
  })
})
