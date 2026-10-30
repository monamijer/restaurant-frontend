import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from '@/views/auth/LoginView.vue'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { ApiError } from '@/utils/errors'
import { mountAt, USERS } from '../helpers/app'

async function signIn(wrapper, email = 'ada@example.com', password = 'secret') {
  await wrapper.get('input[name="email"]').setValue(email)
  await wrapper.get('input[name="password"]').setValue(password)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  session.clear()
})

describe('LoginView', () => {
  it('signs in and lands on the area of the role', async () => {
    const login = vi.spyOn(authService, 'login').mockResolvedValue(USERS.client)
    const { wrapper, router, auth } = await mountAt(LoginView, '/login')

    await signIn(wrapper, '  ada@example.com ')

    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret' })
    expect(auth.user).toEqual(USERS.client)
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('client-account'))
  })

  it('goes back to the page the visitor was heading to', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(USERS.staff)
    const { wrapper, router } = await mountAt(LoginView, '/login?redirect=/staff')

    await signIn(wrapper)

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/staff'))
  })

  it('ignores a redirect that points to another site', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(USERS.client)
    const { wrapper, router } = await mountAt(LoginView, '/login?redirect=//evil.example')

    await signIn(wrapper)

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('client-account'))
  })

  it('explains wrong credentials without revealing which part was wrong', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new ApiError({ status: 401, code: 'AUTHENTICATION_FAILED' }))
    const { wrapper, router, auth } = await mountAt(LoginView, '/login')

    await signIn(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe('Incorrect email address or password.')
    expect(auth.user).toBeNull()
    expect(router.currentRoute.value.name).toBe('login')
  })

  it.each([
    [new ApiError({ status: 429, code: 'THROTTLED' }), 'Too many attempts. Wait a moment before trying again.'],
    [new ApiError({ status: 0, code: 'NETWORK_ERROR' }), 'Cannot connect. Check your network, then try again.'],
    [new ApiError({ status: 500, code: 'SERVER_ERROR' }), 'The server ran into a problem. Please try again later.'],
  ])('tells the visitor about a technical failure', async (failure, message) => {
    vi.spyOn(authService, 'login').mockRejectedValue(failure)
    const { wrapper } = await mountAt(LoginView, '/login')

    await signIn(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe(message)
  })

  it('checks the fields before calling the server', async () => {
    const login = vi.spyOn(authService, 'login')
    const { wrapper } = await mountAt(LoginView, '/login')

    await wrapper.get('form').trigger('submit')

    expect(login).not.toHaveBeenCalled()
    expect(wrapper.findAll('.field__error').map((error) => error.text())).toEqual([
      'This field is required.',
      'This field is required.',
    ])
  })

  it('rejects an address that is not an email', async () => {
    const login = vi.spyOn(authService, 'login')
    const { wrapper } = await mountAt(LoginView, '/login')

    await signIn(wrapper, 'not-an-email', 'secret')

    expect(login).not.toHaveBeenCalled()
    expect(wrapper.get('.field__error').text()).toBe('Enter a valid email address.')
  })

  it('shows it is busy and blocks a second submission', async () => {
    let finish
    const login = vi.spyOn(authService, 'login').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await mountAt(LoginView, '/login')

    await wrapper.get('input[name="email"]').setValue('ada@example.com')
    await wrapper.get('input[name="password"]').setValue('secret')
    await wrapper.get('form').trigger('submit')

    const button = wrapper.get('button[type="submit"]')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('disabled')).toBeDefined()

    finish(USERS.client)
    await flushPromises()
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('links to password recovery and to registration, keeping the destination', async () => {
    const { wrapper } = await mountAt(LoginView, '/login?redirect=/staff')

    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/forgot-password')
    expect(hrefs).toContain('/register?redirect=/staff')
  })
})
