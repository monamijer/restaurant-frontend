import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settingsService } from '@/services/settingsService'
import { useRestaurantStore } from '@/store/restaurant'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('restaurant store', () => {
  it('has a neutral name and no hours until the settings load', () => {
    const restaurant = useRestaurantStore()

    expect(restaurant.name).toBe('Restaurant')
    expect(restaurant.hasHours).toBe(false)
  })

  it('exposes the name and opening hours from the backend', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue({
      name: 'Chez Test',
      opening_time: '09:00:00',
      closing_time: '22:30:00',
    })
    const restaurant = useRestaurantStore()

    await restaurant.load()

    expect(restaurant.name).toBe('Chez Test')
    expect(restaurant.opensAt).toBe('09:00')
    expect(restaurant.closesAt).toBe('22:30')
    expect(restaurant.hasHours).toBe(true)
    expect(restaurant.failed).toBe(false)
    expect(restaurant.loading).toBe(false)
  })

  it('reports a backend that cannot be reached and keeps the neutral name', async () => {
    vi.spyOn(settingsService, 'get').mockRejectedValue(new Error('offline'))
    const restaurant = useRestaurantStore()

    await restaurant.load()

    expect(restaurant.failed).toBe(true)
    expect(restaurant.name).toBe('Restaurant')
    expect(restaurant.loading).toBe(false)
  })

  it('recovers when the backend comes back', async () => {
    const get = vi.spyOn(settingsService, 'get')
    get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ name: 'Chez Test' })
    const restaurant = useRestaurantStore()

    await restaurant.load()
    await restaurant.load()

    expect(restaurant.failed).toBe(false)
    expect(restaurant.name).toBe('Chez Test')
  })
})
