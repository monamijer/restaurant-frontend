import { api } from './api'

export const notificationService = {
  async list(params) {
    const { data } = await api.get('/notifications/', { params })
    return data
  },

  async unreadCount() {
    const { data } = await api.get('/notifications/unread-count/')
    return data.unread
  },

  async markRead(id) {
    const { data } = await api.post(`/notifications/${id}/mark-read/`)
    return data
  },

  async markAllRead() {
    const { data } = await api.post('/notifications/mark-all-read/')
    return data.updated
  },
}
