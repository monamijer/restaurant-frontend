import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import InvoiceCard from '@/components/orders/InvoiceCard.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import { invoiceService } from '@/services/invoiceService'
import { notificationService } from '@/services/notificationService'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { settingsService } from '@/services/settingsService'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import { useToastStore } from '@/store/toasts'
import { saveBlob } from '@/utils/download'
import { ApiError } from '@/utils/errors'
import App from '@/App.vue'
import AccountView from '@/views/AccountView.vue'
import InvoicesView from '@/views/InvoicesView.vue'
import NotificationsView from '@/views/NotificationsView.vue'
import OrderView from '@/views/OrderView.vue'
import { makeInvoice, makeOrder, makePayment, page } from '../helpers/fixtures'
import { mountAt, USERS } from '../helpers/app'

vi.mock('@/utils/download', () => ({ saveBlob: vi.fn() }))

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)

describe('InvoiceCard', () => {
  it('shows the number, date and total', async () => {
    const { wrapper } = await mountAt(InvoiceCard, '/', { props: { invoice: makeInvoice() } })

    expect(wrapper.text()).toContain('Invoice INV-2026-000001')
    expect(wrapper.text()).toContain('$34.10')
    expect(wrapper.text()).toContain('Issued')
  })

  it('downloads the PDF under the invoice number', async () => {
    const blob = new Blob(['pdf'])
    const download = vi.spyOn(invoiceService, 'downloadPdf').mockResolvedValue(blob)
    const { wrapper } = await mountAt(InvoiceCard, '/', { props: { invoice: makeInvoice() } })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(download).toHaveBeenCalledWith(1)
    expect(saveBlob).toHaveBeenCalledWith(blob, 'INV-2026-000001.pdf')
    expect(wrapper.get('button').attributes('aria-label')).toBe('Download invoice INV-2026-000001 as a PDF')
  })

  it('says so when the download fails, and can be tried again', async () => {
    vi.spyOn(invoiceService, 'downloadPdf').mockRejectedValue(new ApiError({ status: 500, code: 'SERVER_ERROR' }))
    const { wrapper } = await mountAt(InvoiceCard, '/', { props: { invoice: makeInvoice() } })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(useToastStore().items.map((toast) => toast.message)).toEqual([
      'The invoice could not be downloaded. Please try again.',
    ])
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })

  it('never downloads twice at once', async () => {
    let finish
    const download = vi.spyOn(invoiceService, 'downloadPdf').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await mountAt(InvoiceCard, '/', { props: { invoice: makeInvoice() } })

    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    finish(new Blob())
    await flushPromises()

    expect(download).toHaveBeenCalledTimes(1)
  })
})

describe('InvoicesView', () => {
  it('lists the invoices with a link to each order', async () => {
    vi.spyOn(invoiceService, 'list').mockResolvedValue(page([makeInvoice(), makeInvoice({ id: 2, order: 43, invoice_number: 'INV-2026-000002' })]))
    const { wrapper } = await mountAt(InvoicesView, '/invoices', { user: USERS.client })

    expect(wrapper.findAll('.row')).toHaveLength(2)
    expect(wrapper.text()).toContain('INV-2026-000002')
    expect(wrapper.findAll('.row__order').map((link) => link.attributes('href'))).toEqual(['/orders/42', '/orders/43'])
  })

  it('explains that an invoice comes with payment', async () => {
    vi.spyOn(invoiceService, 'list').mockResolvedValue(page([]))
    const { wrapper } = await mountAt(InvoicesView, '/invoices', { user: USERS.client })

    expect(wrapper.text()).toContain('No invoices yet')
  })

  it('reports a failure and pages through the list', async () => {
    const list = vi.spyOn(invoiceService, 'list')
    list.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' })).mockResolvedValue(page([makeInvoice()], 25))
    const { wrapper, router } = await mountAt(InvoicesView, '/invoices', { user: USERS.client })
    expect(wrapper.text()).toContain('Your invoices could not be loaded.')

    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()
    await wrapper.findAll('nav button')[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    expect(list).toHaveBeenLastCalledWith({ page: 2, page_size: 10 })
  })
})

describe('the invoice on an order', () => {
  function order(payments, invoice) {
    vi.spyOn(orderService, 'get').mockResolvedValue(makeOrder())
    vi.spyOn(paymentService, 'forOrder').mockResolvedValue(payments)
    const lookup = vi.spyOn(invoiceService, 'forOrder').mockResolvedValue(invoice)
    return mountAt(OrderView, '/orders/42', { user: USERS.client }).then((page) => ({ ...page, lookup }))
  }

  it('appears once the order is paid', async () => {
    const { wrapper, lookup } = await order([makePayment()], makeInvoice())

    expect(lookup).toHaveBeenCalledWith(42)
    expect(wrapper.get('.invoice-box').text()).toContain('INV-2026-000001')
  })

  it('is not even looked for while the order is unpaid', async () => {
    const { wrapper, lookup } = await order([], null)

    expect(lookup).not.toHaveBeenCalled()
    expect(wrapper.find('.invoice-box').exists()).toBe(false)
  })

  it('does not hide the order when the invoice cannot be found yet', async () => {
    const { wrapper } = await order([makePayment()], null)

    expect(wrapper.get('h1').text()).toBe('Order #42')
    expect(wrapper.find('.invoice-box').exists()).toBe(false)
  })

  it('does not hide the order when looking for the invoice fails', async () => {
    vi.spyOn(orderService, 'get').mockResolvedValue(makeOrder())
    vi.spyOn(paymentService, 'forOrder').mockResolvedValue([makePayment()])
    vi.spyOn(invoiceService, 'forOrder').mockRejectedValue(new ApiError({ status: 500, code: 'SERVER_ERROR' }))

    const { wrapper } = await mountAt(OrderView, '/orders/42', { user: USERS.client })

    expect(wrapper.get('h1').text()).toBe('Order #42')
  })
})

describe('NotificationBell and the header', () => {
  it('shows no count when everything is read, and the count otherwise', async () => {
    const { wrapper } = await mountAt(NotificationBell, '/', { user: USERS.client })
    expect(wrapper.attributes('aria-label')).toBe('Notifications')
    expect(wrapper.find('.bell__count').exists()).toBe(false)

    useNotificationStore().unread = 3
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('aria-label')).toBe('Notifications: 3 unread')
    expect(wrapper.get('.bell__count').text()).toBe('3')
    expect(wrapper.attributes('href')).toBe('/notifications')
  })

  it('caps a very large count', async () => {
    const { wrapper } = await mountAt(NotificationBell, '/', { user: USERS.client, before: () => (useNotificationStore().unread = 250) })

    expect(wrapper.get('.bell__count').text()).toBe('99+')
  })

  it('is in the header only for a signed-in user', async () => {
    const visitor = await mountAt(AppHeader, '/')
    const member = await mountAt(AppHeader, '/', { user: USERS.client })

    expect(visitor.wrapper.find('a[href="/notifications"]').exists()).toBe(false)
    expect(member.wrapper.find('a[href="/notifications"]').exists()).toBe(true)
  })
})

describe('NotificationsView', () => {
  const items = () => [
    { id: 1, type: 'order', message: 'Your order is ready', is_read: false, created_at: '2026-10-10T17:00:00Z' },
    { id: 2, type: 'order', message: 'Your order was confirmed', is_read: true, created_at: '2026-10-10T16:00:00Z' },
  ]
  const open = () => {
    vi.spyOn(notificationService, 'list').mockResolvedValue(page(items()))
    vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(1)
    return mountAt(NotificationsView, '/notifications', { user: USERS.client })
  }

  it('lists the messages and marks the unread ones', async () => {
    const { wrapper } = await open()

    const rows = wrapper.findAll('.item')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Your order is ready')
    expect(rows[0].text()).toContain('Unread')
    expect(rows[0].classes()).toContain('item--unread')
    expect(rows[1].text()).not.toContain('Unread')
  })

  it('marks one as read', async () => {
    const { wrapper } = await open()
    vi.spyOn(notificationService, 'markRead').mockResolvedValue({ id: 1, is_read: true })

    await button(wrapper, 'Mark as read').trigger('click')
    await flushPromises()

    expect(notificationService.markRead).toHaveBeenCalledWith(1)
    expect(wrapper.findAll('.item')[0].classes()).not.toContain('item--unread')
  })

  it('marks all as read, then hides the button', async () => {
    const { wrapper } = await open()
    vi.spyOn(notificationService, 'markAllRead').mockResolvedValue(1)

    await button(wrapper, 'Mark all as read').trigger('click')
    await flushPromises()

    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['All notifications marked as read.'])
    expect(button(wrapper, 'Mark all as read')).toBeUndefined()
  })

  it('explains an empty list, reports a failure and can retry', async () => {
    const list = vi.spyOn(notificationService, 'list')
    list.mockResolvedValueOnce(page([])).mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' })).mockResolvedValue(page(items()))
    vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(0)

    const empty = await mountAt(NotificationsView, '/notifications', { user: USERS.client })
    expect(empty.wrapper.text()).toContain('Nothing new')

    const failed = await mountAt(NotificationsView, '/notifications', { user: USERS.client })
    expect(failed.wrapper.text()).toContain('Your notifications could not be loaded.')
    await button(failed.wrapper, 'Try again').trigger('click')
    await flushPromises()
    expect(failed.wrapper.findAll('.item')).toHaveLength(2)
  })
})

describe('AccountView shortcuts', () => {
  it('leads to everything personal', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue({})
    const { wrapper } = await mountAt(AccountView, '/client/account', { user: USERS.client })

    const links = wrapper.findAll('.account__links a')
    expect(links.map((link) => link.attributes('href'))).toEqual(['/orders', '/reservations', '/invoices', '/notifications'])
    expect(links.map((link) => link.text())).toEqual(['My orders', 'My reservations', 'My invoices', 'Notifications'])
  })
})

describe('the application and its notifications', () => {
  it('checks for news while someone is signed in, and forgets everything at sign out', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue({ name: 'Chez Test' })
    const unread = vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(2)
    const { auth } = await mountAt(App, '/', { user: USERS.client })
    await flushPromises()

    expect(unread).toHaveBeenCalled()
    expect(useNotificationStore().unread).toBe(2)

    auth.user = null
    await flushPromises()

    expect(useNotificationStore().unread).toBe(0)
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('does not ask a visitor anything', async () => {
    vi.spyOn(settingsService, 'get').mockResolvedValue({ name: 'Chez Test' })
    const unread = vi.spyOn(notificationService, 'unreadCount').mockResolvedValue(0)

    await mountAt(App, '/', { user: null })
    await flushPromises()

    expect(unread).not.toHaveBeenCalled()
  })
})
