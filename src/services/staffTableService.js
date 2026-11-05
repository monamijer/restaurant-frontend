import { api } from './api'

/**
 * Staff-side table operations. The customer `tableService` only resolves QR
 * tokens; the staff floor needs the full list of tables (filterable by status
 * and location), per `api.md`: GET /tables/ is signed-in, staff can filter
 * by status, min_capacity and location.
 */
export const staffTableService = {
  async list(params = {}) {
    const { data } = await api.get('/tables/', { params })
    return data
  },
}
