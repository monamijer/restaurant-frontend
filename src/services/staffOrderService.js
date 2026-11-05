import { api } from './api';

/**
 * Staff-side order operations. Wraps the same backend endpoints as
 * `orderService` but keeps staff-only calls (status changes, walk-in
 * creation) out of the customer service.
 */
const staffOrderService = {
  /**
   * List orders for the staff board.
   * Query: { status, order_type, table, active, ordering, page, page_size }
   */
  async list(query = {}) {
    const response = await api.get('/orders/', { params: query });
    return response.data;
  },

  /** Fetch a single order by id (staff sees any order). */
  async get(id) {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  /**
   * Advance the order to the given status.
   * The server enforces the transitions and returns the updated order.
   */
  async updateStatus(id, status) {
    const response = await api.post(`/orders/${id}/update-status/`, { status });
    return response.data;
  },

  /**
   * Cancel the order (staff). A paid order cannot be cancelled: the server
   * answers with a CONFLICT or VALIDATION error, mapped by `api.js`.
   */
  async cancel(id) {
    const response = await api.post(`/orders/${id}/cancel/`);
    return response.data;
  },

  /**
   * Create a walk-in order. Staff may pass `table` (id) for a dine-in order.
   * Body: { order_type, table?, contact_phone?, notes?, items: [...] }
   */
  async create(payload) {
    const response = await api.post('/orders/', payload);
    return response.data;
  },
};

export default staffOrderService;
