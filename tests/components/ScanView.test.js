import { describe, expect, it, vi } from 'vitest'
import { tableService } from '@/services/tableService'
import { useTableStore } from '@/store/table'
import { ApiError } from '@/utils/errors'
import ScanView from '@/views/ScanView.vue'
import { mountAt } from '../helpers/app'

describe('ScanView', () => {
  it('recognises the table, remembers it and offers to order', async () => {
    const resolve = vi.spyOn(tableService, 'resolveQr').mockResolvedValue({ id: 3, number: 5, capacity: 4, location: '' })
    const { wrapper } = await mountAt(ScanView, '/scan?t=abc:def:ghi')

    expect(resolve).toHaveBeenCalledWith('abc:def:ghi')
    expect(wrapper.get('h1').text()).toBe('You are at table 5')
    expect(useTableStore().number).toBe(5)
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual(['/menu', '/cart'])
  })

  it('works for a visitor who is not signed in', async () => {
    vi.spyOn(tableService, 'resolveQr').mockResolvedValue({ id: 3, number: 5, capacity: 4, location: '' })
    const { wrapper, auth } = await mountAt(ScanView, '/scan?t=abc')

    expect(auth.isAuthenticated).toBe(false)
    expect(wrapper.get('h1').text()).toContain('table 5')
  })

  it('says the code does not work, without saying why', async () => {
    vi.spyOn(tableService, 'resolveQr').mockRejectedValue(new ApiError({ status: 400, code: 'VALIDATION_ERROR' }))
    const { wrapper } = await mountAt(ScanView, '/scan?t=old-code')

    expect(wrapper.get('h1').text()).toBe('This code does not work')
    expect(useTableStore().isSeated).toBe(false)
  })

  it('does not even ask the server when there is no usable code', async () => {
    const resolve = vi.spyOn(tableService, 'resolveQr')
    const missing = await mountAt(ScanView, '/scan')
    const junk = await mountAt(ScanView, '/scan?t=%3Cscript%3E')

    expect(resolve).not.toHaveBeenCalled()
    expect(missing.wrapper.get('h1').text()).toBe('This code does not work')
    expect(junk.wrapper.get('h1').text()).toBe('This code does not work')
  })

  it('shows a progress message while it checks', async () => {
    vi.spyOn(tableService, 'resolveQr').mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountAt(ScanView, '/scan?t=abc')

    expect(wrapper.text()).toContain('Checking the code')
  })
})
