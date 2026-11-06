import { api } from './api'

/** Read-only customer list for staff. The backend only returns accounts with the client role. */
export const staffCustomerService = {
  /** One page of customers. Filters: search (name, email, phone), page, page_size. */
  async list(params = {}) {
    const { data } = await api.get('/users/', { params })
    return data
  },
}
