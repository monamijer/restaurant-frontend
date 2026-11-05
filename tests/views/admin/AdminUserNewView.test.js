import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminUserNewView from '../../../src/views/admin/AdminUserNewView.vue'
import { adminUserService } from '../../../src/services/adminUserService'

describe('AdminUserNewView', () => {
  it('creates a user with the chosen role', async () => {
    vi.spyOn(adminUserService, 'create').mockResolvedValue({ id: 9 })
    const { wrapper, router } = await mountAt(AdminUserNewView, '/admin/users/new', { user: USERS.admin })
    await flushPromises()

    await wrapper.find('input[name="email"]').setValue('new@example.com')
    await wrapper.find('input[name="password"]').setValue('correct-horse-battery')
    await wrapper.find('select#user-role').setValue('staff')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(adminUserService.create).toHaveBeenCalled()
    const payload = adminUserService.create.mock.calls[0][0]
    expect(payload.email).toBe('new@example.com')
    expect(payload.role).toBe('staff')

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('admin-user-edit'))
  })

  it('refuses an invalid email', async () => {
    vi.spyOn(adminUserService, 'create').mockResolvedValue({})
    const { wrapper } = await mountAt(AdminUserNewView, '/admin/users/new', { user: USERS.admin })
    await flushPromises()

    await wrapper.find('input[name="email"]').setValue('not-an-email')
    await wrapper.find('input[name="password"]').setValue('correct-horse-battery')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(adminUserService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('A valid email is required.')
  })
})
