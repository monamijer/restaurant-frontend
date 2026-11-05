import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminSettingsView from '../../../src/views/admin/AdminSettingsView.vue'
import { settingsService } from '../../../src/services/settingsService'
import { useRestaurantStore } from '../../../src/store/restaurant'

const SETTINGS = {
  name: 'Chez Test',
  timezone: 'Africa/Bujumbura',
  opening_time: '09:00:00',
  closing_time: '22:00:00',
  slot_step_minutes: 30,
  min_reservation_minutes: 30,
  max_reservation_minutes: 180,
  pending_reservation_expiry_minutes: 30,
  tax_rate: '10.00',
  queue_minutes_per_party: 10,
}

describe('AdminSettingsView', () => {
  it('loads and displays the current settings', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue(SETTINGS)
    const { wrapper } = await mountAt(AdminSettingsView, '/admin/settings', { user: USERS.admin })
    await flushPromises()
    const name = wrapper.find('input[name="name"]')
    expect(name.element.value).toBe('Chez Test')
    expect(wrapper.find('input[type="time"]').element.value).toBe('09:00')
  })

  it('PATCHes the settings and refreshes the restaurant store', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue(SETTINGS)
    vi.spyOn(settingsService, 'update').mockResolvedValue({ ...SETTINGS, name: 'Chez New' })
    const { wrapper } = await mountAt(AdminSettingsView, '/admin/settings', { user: USERS.admin })
    await flushPromises()
    // After a successful PATCH the view reloads the store; return the new name.
    settingsService.get.mockResolvedValue({ ...SETTINGS, name: 'Chez New' })

    await wrapper.find('input[name="name"]').setValue('Chez New')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(settingsService.update).toHaveBeenCalled()
    const payload = settingsService.update.mock.calls[0][0]
    expect(payload.name).toBe('Chez New')
    expect(payload.opening_time).toBe('09:00')
    expect(payload.tax_rate).toBe('10.00')

    const store = useRestaurantStore()
    expect(store.name).toBe('Chez New')
  })

  it('refuses a closing time before the opening time', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue(SETTINGS)
    vi.spyOn(settingsService, 'update').mockResolvedValue(SETTINGS)
    const { wrapper } = await mountAt(AdminSettingsView, '/admin/settings', { user: USERS.admin })
    await flushPromises()

    const times = wrapper.findAll('input[type="time"]')
    await times[0].setValue('20:00')
    await times[1].setValue('10:00')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(settingsService.update).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('The closing time must be after the opening time.')
  })

  it('offers a retry when the settings cannot be loaded', async () => {
    vi.spyOn(settingsService, 'get').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminSettingsView, '/admin/settings', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the settings.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
