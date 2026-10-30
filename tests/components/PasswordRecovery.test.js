import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/authService'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import { mountAt } from '../helpers/app'

describe('ForgotPasswordView', () => {
  async function ask(wrapper, email) {
    await wrapper.get('input[name="email"]').setValue(email)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
  }

  it('asks for the link and confirms without revealing whether the account exists', async () => {
    const request = vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue()
    const { wrapper } = await mountAt(ForgotPasswordView, '/forgot-password')

    await ask(wrapper, ' ada@example.com ')

    expect(request).toHaveBeenCalledWith('ada@example.com')
    expect(wrapper.get('[role="status"]').text()).toContain('If an account exists for this address')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('checks the address first', async () => {
    const request = vi.spyOn(authService, 'requestPasswordReset')
    const { wrapper } = await mountAt(ForgotPasswordView, '/forgot-password')

    await ask(wrapper, 'nope')

    expect(request).not.toHaveBeenCalled()
    expect(wrapper.get('.field__error').text()).toBe('Enter a valid email address.')
  })

  it('reports a failure to send the request', async () => {
    vi.spyOn(authService, 'requestPasswordReset').mockRejectedValue(new ApiError({ status: 429, code: 'THROTTLED' }))
    const { wrapper } = await mountAt(ForgotPasswordView, '/forgot-password')

    await ask(wrapper, 'ada@example.com')

    expect(wrapper.get('[role="alert"]').text()).toContain('Too many attempts')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('offers a way back to sign in', async () => {
    const { wrapper } = await mountAt(ForgotPasswordView, '/forgot-password')

    expect(wrapper.get('a').attributes('href')).toBe('/login')
  })
})

describe('ResetPasswordView', () => {
  const LINK = '/reset-password?uid=MQ&token=abc-123'

  async function choose(wrapper, password, confirmation = password) {
    await wrapper.get('input[name="new_password"]').setValue(password)
    await wrapper.get('input[name="confirm_password"]').setValue(confirmation)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
  }

  it('sets the new password with the link parameters, then goes to sign in', async () => {
    const confirm = vi.spyOn(authService, 'confirmPasswordReset').mockResolvedValue()
    const { wrapper, router } = await mountAt(ResetPasswordView, LINK)

    await choose(wrapper, 'Fresh-Start-1!')

    expect(confirm).toHaveBeenCalledWith({ uid: 'MQ', token: 'abc-123', newPassword: 'Fresh-Start-1!' })
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Password changed. You can now sign in.'])
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
  })

  it('refuses two different passwords before calling the server', async () => {
    const confirm = vi.spyOn(authService, 'confirmPasswordReset')
    const { wrapper } = await mountAt(ResetPasswordView, LINK)

    await choose(wrapper, 'Fresh-Start-1!', 'Something-else')

    expect(confirm).not.toHaveBeenCalled()
    expect(wrapper.get('.field__error').text()).toBe('The two passwords do not match.')
  })

  it('shows a weak password message on the password field', async () => {
    vi.spyOn(authService, 'confirmPasswordReset').mockRejectedValue(
      new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { new_password: ['This password is too common.'] } }),
    )
    const { wrapper } = await mountAt(ResetPasswordView, LINK)

    await choose(wrapper, '12345678')

    expect(wrapper.get('.field__error').text()).toBe('This password is too common.')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('replaces the form with a clear message when the link is refused', async () => {
    vi.spyOn(authService, 'confirmPasswordReset').mockRejectedValue(
      new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { token: ['Invalid or expired.'] } }),
    )
    const { wrapper } = await mountAt(ResetPasswordView, LINK)

    await choose(wrapper, 'Fresh-Start-1!')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toBe('This link is invalid or has expired.')
    expect(wrapper.get('a').attributes('href')).toBe('/forgot-password')
  })

  it('does not even offer the form when the link has no parameters', async () => {
    const { wrapper } = await mountAt(ResetPasswordView, '/reset-password')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toBe('This link is invalid or has expired.')
  })
})
