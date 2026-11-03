import { api } from './api'

export const tableService = {
  /** Turn a scanned QR token into the table it designates (public). */
  async resolveQr(token) {
    const { data } = await api.post('/tables/resolve-qr/', { token }, { skipAuth: true, skipRefresh: true })
    return data
  },
}
