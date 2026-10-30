import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import RegisterView from '@/views/auth/RegisterView.vue'
import { mountAt, USERS } from '../helpers/app'

async function fillAndSubmit(wrapper, values = {}) {
  const data = {
    first_name: ' Ada ',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    new_password: 'Str0ng-pass!',
    ...values,
  }
  await wrapper.get('input[name="first_name"]').setValue(data.first_name)
  await wrapper.get('input[name="last_name"]').setValue(data.last_name)
  await wrapper.get('input[name="email"]').setValue(data.email)
  await wrapper.get('input[name="phone"]').setValue(data.phone)
  await wrapper.get('input[name="password"]').setValue(data.new_password)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  session.clear()
})

describe('RegisterView', () => {
  it('creates the account, welcomes the customer and lands on their area', async () => {
    const register = vi.spyOn(authService, 'register').mockResolvedValue(USERS.client)
    vi.spyOn(authService, 'login').mockResolvedValue(USERS.client)
    const { wrapper, router } = await mountAt(RegisterView, '/register')

    await fillAndSubmit(wrapper)

    expect(register).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'Str0ng-pass!',
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone: '',
    })
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Welcome, Ada!'])
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('client-account'))
  })

  it('shows the backend messages next to the fields they belong to', async () => {
    vi.spyOn(authService, 'register').mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        errors: { email: ['A user with this email already exists.'], password: ['This password is too common.'] },
      }),
    )
    const { wrapper, router } = await mountAt(RegisterView, '/register')

    await fillAndSubmit(wrapper)

    const errors = wrapper.findAll('.field__error').map((error) => error.text())
    expect(errors).toEqual(['A user with this email already exists.', 'This password is too common.'])
    expect(router.currentRoute.value.name).toBe('register')
  })

  it('requires the essential fields before calling the server', async () => {
    const register = vi.spyOn(authService, 'register')
    const { wrapper } = await mountAt(RegisterView, '/register')

    await wrapper.get('form').trigger('submit')

    expect(register).not.toHaveBeenCalled()
    expect(wrapper.findAll('.field__error')).toHaveLength(4)
  })

  it('keeps the phone number optional', async () => {
    const { wrapper } = await mountAt(RegisterView, '/register')

    expect(wrapper.get('input[name="phone"]').attributes('required')).toBeUndefined()
    expect(wrapper.text()).toContain('optional')
  })

  it('helps with the password rules', async () => {
    const { wrapper } = await mountAt(RegisterView, '/register')

    expect(wrapper.get('.field__hint').text()).toContain('At least 8 characters')
  })
})
