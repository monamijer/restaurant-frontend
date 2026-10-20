import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from '@/store/toasts'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toasts', () => {
  it('shows a message with its type', () => {
    const toasts = useToastStore()

    toasts.success('Saved')
    toasts.error('Failed')
    toasts.info('FYI')

    expect(toasts.items.map((toast) => [toast.type, toast.message])).toEqual([
      ['success', 'Saved'],
      ['error', 'Failed'],
      ['info', 'FYI'],
    ])
  })

  it('removes a message by itself after a few seconds', () => {
    const toasts = useToastStore()
    toasts.success('Saved')

    vi.advanceTimersByTime(4500)

    expect(toasts.items).toEqual([])
  })

  it('keeps errors on screen longer than other messages', () => {
    const toasts = useToastStore()
    toasts.success('Saved')
    toasts.error('Failed')

    vi.advanceTimersByTime(4500)

    expect(toasts.items.map((toast) => toast.type)).toEqual(['error'])
    vi.advanceTimersByTime(2500)
    expect(toasts.items).toEqual([])
  })

  it('can be dismissed by hand', () => {
    const toasts = useToastStore()
    const id = toasts.info('One')
    toasts.info('Two')

    toasts.dismiss(id)

    expect(toasts.items.map((toast) => toast.message)).toEqual(['Two'])
  })

  it('shows at most four messages, dropping the oldest', () => {
    const toasts = useToastStore()

    for (let n = 1; n <= 6; n += 1) toasts.info(`Message ${n}`)

    expect(toasts.items.map((toast) => toast.message)).toEqual([
      'Message 3',
      'Message 4',
      'Message 5',
      'Message 6',
    ])
  })
})
