import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import formErrors from '@/mixins/formErrors'
import { ApiError } from '@/utils/errors'

function form() {
  return mount(
    { mixins: [formErrors], template: '<div />' },
    { global: { mocks: { $t: (key) => `t:${key}` } } },
  ).vm
}

describe('form errors', () => {
  it('starts clean', () => {
    const vm = form()

    expect(vm.errors).toEqual({})
    expect(vm.formError).toBe('')
    expect(vm.submitting).toBe(false)
  })

  it('shows validation errors next to their fields', () => {
    const vm = form()

    vm.showApiError(new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { email: ['Taken.'], phone: ['Bad.'] } }))

    expect(vm.errors).toEqual({ email: 'Taken.', phone: 'Bad.' })
    expect(vm.formError).toBe('')
  })

  it('puts form-wide validation errors in the alert', () => {
    const vm = form()

    vm.showApiError(new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { non_field_errors: ['Mismatch.'], email: ['Bad.'] } }))

    expect(vm.formError).toBe('Mismatch.')
    expect(vm.errors).toEqual({ email: 'Bad.' })
  })

  it('lets a status override the message', () => {
    const vm = form()

    vm.showApiError(new ApiError({ status: 401, code: 'AUTHENTICATION_FAILED' }), { 401: 'Wrong password.' })

    expect(vm.formError).toBe('Wrong password.')
  })

  it('falls back to a translated generic message', () => {
    const vm = form()

    vm.showApiError(new ApiError({ status: 500, code: 'SERVER_ERROR' }))

    expect(vm.formError).toBe('t:errors.server')
  })

  it('wraps an error that is not an ApiError', () => {
    const vm = form()

    vm.showApiError(new Error('boom'))

    expect(vm.formError).toBe('boom')
  })

  it('clears the previous errors before showing new ones', () => {
    const vm = form()
    vm.showApiError(new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { email: ['Bad.'] } }))

    vm.showApiError(new ApiError({ status: 500, code: 'SERVER_ERROR' }))

    expect(vm.errors).toEqual({})
  })
})
