import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminUserEditView from '../../../src/views/admin/AdminUserEditView.vue'
import { adminUserService } from '../../../src/services/adminUserService'

const TARGET = {
  id: 5, email: 'ada@example.com', first_name: 'Ada', last_name: 'L',
  phone: '', address: '', role: 'client', is_active: true,
  orders_count: 0, total_spent: '0.00', last_order_at: null,
}

describe('AdminUserEditView', () => {
  it('loads the user and PATCHes the editable fields', async () => {
    vi.spyOn(adminUserService, 'get').mockResolvedValue(TARGET)
    vi.spyOn(adminUserService, 'update').mockResolvedValue({ ...TARGET, first_name: 'Ada2' })
    const { wrapper } = await mountAt(AdminUserEditView, '/admin/users/5/edit', { user: USERS.admin })
    await flushPromises()

    await wrapper.find('input[name="first_name"]').setValue('Ada2')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const [id, payload] = adminUserService.update.mock.calls[0]
    expect(id).toBe(5)
    expect(payload.first_name).toBe('Ada2')
  })

  it('hides the role selector and the deactivate button on the admin account itself', async () => {
    vi.spyOn(adminUserService, 'get').mockResolvedValue({ ...TARGET, id: USERS.admin.id, role: 'admin' })
    const { wrapper } = await mountAt(
      AdminUserEditView,
      `/admin/users/${USERS.admin.id}/edit`,
      { user: USERS.admin },
    )
    await flushPromises()
    expect(wrapper.find('select#user-role').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('button').some((b) => b.text() === 'Deactivate')).toBe(false)
  })

  it('asks for a confirmation before deactivating another user', async () => {
    vi.spyOn(adminUserService, 'get').mockResolvedValue(TARGET)
    vi.spyOn(adminUserService, 'setActive').mockResolvedValue({ ...TARGET, is_active: false })
    const { wrapper } = await mountAt(AdminUserEditView, '/admin/users/5/edit', { user: USERS.admin })
    await flushPromises()

    const deactivate = wrapper.findAll('button').find((b) => b.text() === 'Deactivate')
    await deactivate.trigger('click')
    await flushPromises()
    expect(adminUserService.setActive).not.toHaveBeenCalled()

    const confirm = wrapper.findAll('footer button').find((b) => b.text() === 'Yes, deactivate')
    await confirm.trigger('click')
    await flushPromises()
    expect(adminUserService.setActive).toHaveBeenCalledWith(5, false)
  })
})
