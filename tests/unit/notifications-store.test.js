import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationService } from '@/services/notificationService'
import { POLL_INTERVAL_MS, useNotificationStore } from '@/store/notifications'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})

afterEach(() => {
  useNotificationStore().stopPolling()
  vi.useRealTimers()
})

describe('unread count', () => {
  it('shows what the server counts', async () => {
    vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(4)
    const store = useNotificationStore()

    await store.refreshUnread()

    expect(store.unread).toBe(4)
  })

  it('keeps the last count when a check fails', async () => {
    vi.spyOn(notificationService, 'unreadCount').mockResolvedValueOnce(2).mockRejectedValueOnce(new Error('offline'))
    const store = useNotificationStore()

    await store.refreshUnread()
    await store.refreshUnread()

    expect(store.unread).toBe(2)
  })

  it('does not ask while the tab is hidden', async () => {
    const count = vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(1)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    await useNotificationStore().refreshUnread()

    expect(count).not.toHaveBeenCalled()
  })
})

describe('polling', () => {
  it('checks at once and then at a regular pace, until stopped', async () => {
    const count = vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(1)
    const store = useNotificationStore()

    store.startPolling()
    expect(count).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(count).toHaveBeenCalledTimes(3)

    store.stopPolling()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(count).toHaveBeenCalledTimes(3)
  })

  it('never runs two timers when started twice', async () => {
    const count = vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(0)
    const store = useNotificationStore()

    store.startPolling()
    store.startPolling()
    count.mockClear()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(count).toHaveBeenCalledTimes(1)
  })

  it('forgets everything when someone signs out', async () => {
    vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(5)
    const store = useNotificationStore()
    store.startPolling()
    await vi.advanceTimersByTimeAsync(0)
    store.items = [{ id: 1, message: 'x', is_read: false }]

    store.reset()

    expect(store.unread).toBe(0)
    expect(store.items).toEqual([])
    notificationService.unreadCount.mockClear()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(notificationService.unreadCount).not.toHaveBeenCalled()
  })
})

describe('the list', () => {
  const items = () => [
    { id: 1, type: 'order', message: 'Ready', is_read: false, created_at: '2026-10-10T17:00:00Z' },
    { id: 2, type: 'order', message: 'Confirmed', is_read: true, created_at: '2026-10-10T16:00:00Z' },
  ]

  it('loads a page, or reports a failure', async () => {
    const list = vi.spyOn(notificationService, 'list')
    list.mockResolvedValueOnce({ count: 2, results: items() }).mockRejectedValueOnce(new Error('offline'))
    const store = useNotificationStore()

    await store.load({ page: 1 })
    expect(store.items).toHaveLength(2)
    expect(store.count).toBe(2)
    expect(store.failed).toBe(false)

    await store.load({ page: 1 })
    expect(store.failed).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('marks one as read and lowers the badge, only once', async () => {
    vi.spyOn(notificationService, 'markRead').mockResolvedValue({ id: 1, is_read: true })
    const store = useNotificationStore()
    store.items = items()
    store.unread = 1

    await store.markRead(1)
    await store.markRead(1)

    expect(store.items[0].is_read).toBe(true)
    expect(store.unread).toBe(0)
  })

  it('marks everything as read', async () => {
    vi.spyOn(notificationService, 'markAllRead').mockResolvedValue(1)
    const store = useNotificationStore()
    store.items = items()
    store.unread = 1

    await store.markAllRead()

    expect(store.items.every((item) => item.is_read)).toBe(true)
    expect(store.unread).toBe(0)
  })
})
