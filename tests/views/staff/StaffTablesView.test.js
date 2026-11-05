import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffTablesView from '../../../src/views/staff/StaffTablesView.vue'
import { staffTableService } from '../../../src/services/staffTableService'

const TABLE = { id: 3, number: '5', capacity: 4, location: 'patio', status: 'available' }
const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub(list = [TABLE]) {
  vi.spyOn(staffTableService, 'list').mockResolvedValue(PAGE(list))
}

describe('StaffTablesView', () => {
  it('lists the tables with their status and actions', async () => {
    stub()
    const { wrapper } = await mountAt(StaffTablesView, '/staff/tables', { user: USERS.staff })
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Table 5')
    expect(text).toContain('patio')
    expect(text).toContain('QR code')
    expect(text).toContain('Regenerate')
  })

  it('changes the status with setStatus and updates the row', async () => {
    stub()
    vi.spyOn(staffTableService, 'setStatus').mockResolvedValue({ ...TABLE, status: 'occupied' })
    const { wrapper } = await mountAt(StaffTablesView, '/staff/tables', { user: USERS.staff })
    await flushPromises()
    const rowSelect = wrapper.find('.card select')
    await rowSelect.setValue('occupied')
    await flushPromises()
    expect(staffTableService.setStatus).toHaveBeenCalledWith(3, 'occupied')
  })

  it('asks for a confirmation before regenerating the QR code', async () => {
    stub()
    vi.spyOn(staffTableService, 'regenerateQr').mockResolvedValue({})
    const { wrapper } = await mountAt(StaffTablesView, '/staff/tables', { user: USERS.staff })
    await flushPromises()
    const regenerate = wrapper.findAll('button').find((b) => b.text() === 'Regenerate')
    await regenerate.trigger('click')
    await flushPromises()
    expect(staffTableService.regenerateQr).not.toHaveBeenCalled()
    const dialogConfirm = wrapper.findAll('footer button').find((b) => b.text() === 'Yes, regenerate')
    await dialogConfirm.trigger('click')
    await flushPromises()
    expect(staffTableService.regenerateQr).toHaveBeenCalledWith(3)
  })

  it('passes the filters to the service', async () => {
    const spy = vi.spyOn(staffTableService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(StaffTablesView, '/staff/tables?status=available&location=patio', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, status: 'available', location: 'patio' })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(staffTableService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffTablesView, '/staff/tables', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the tables.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
