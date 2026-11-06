import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminTableFormView from '../../../src/views/admin/AdminTableFormView.vue'
import { ApiError } from '../../../src/utils/errors'
import { staffTableService } from '../../../src/services/staffTableService'

describe('AdminTableFormView', () => {
  it('creates a table with the typed values', async () => {
    const spy = vi.spyOn(staffTableService, 'create').mockResolvedValue({ id: 9 })
    const { wrapper } = await mountAt(AdminTableFormView, '/admin/tables/new', { user: USERS.admin })
    await flushPromises()
    await wrapper.find('input[name="number"]').setValue('7')
    await wrapper.find('input[name="capacity"]').setValue('4')
    await wrapper.find('input[name="location"]').setValue('patio')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ number: 7, capacity: 4, location: 'patio' })
  })

  it('refuses an invalid capacity without calling the API', async () => {
    const spy = vi.spyOn(staffTableService, 'create').mockResolvedValue({ id: 9 })
    const { wrapper } = await mountAt(AdminTableFormView, '/admin/tables/new', { user: USERS.admin })
    await flushPromises()
    await wrapper.find('input[name="number"]').setValue('7')
    await wrapper.find('input[name="capacity"]').setValue('99')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(spy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('between 1 and 50')
  })

  it('loads the table and updates it', async () => {
    vi.spyOn(staffTableService, 'get').mockResolvedValue({ id: 3, number: 5, capacity: 4, location: 'patio' })
    const spy = vi.spyOn(staffTableService, 'update').mockResolvedValue({ id: 3 })
    const { wrapper } = await mountAt(AdminTableFormView, '/admin/tables/3/edit', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.find('input[name="number"]').element.value).toBe('5')
    await wrapper.find('input[name="capacity"]').setValue('6')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(spy).toHaveBeenCalledWith(3, { number: 5, capacity: 6, location: 'patio' })
  })

  it('shows the field error sent by the backend', async () => {
    const error = new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { number: ['Table with this number already exists.'] } })
    vi.spyOn(staffTableService, 'create').mockRejectedValue(error)
    const { wrapper } = await mountAt(AdminTableFormView, '/admin/tables/new', { user: USERS.admin })
    await flushPromises()
    await wrapper.find('input[name="number"]').setValue('5')
    await wrapper.find('input[name="capacity"]').setValue('4')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('already exists')
  })
})
