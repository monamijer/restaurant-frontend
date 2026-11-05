import api from './api';

/**
 * Staff-side payment operations. Only cash payments can be confirmed by
 * staff; the backend is the authority on which payments are eligible.
 */
const staffPaymentService = {
  /**
   * List payments of an order (newest first).
   * Returns the paginated shape: { count, next, previous, results }.
   */
  async listForOrder(orderId, query = {}) {
    const response = await api.get('/payments/', {
      params: { order: orderId, ordering: '-created_at', ...query },
    });
    return response.data;
  },

  /**
   * Confirm a pending cash payment. The server returns the updated payment
   * (status becomes `paid`). Non-cash payments are rejected by the server.
   */
  async confirm(id) {
    const response = await api.post(`/payments/${id}/confirm/`);
    return response.data;
  },
};

export default staffPaymentService;
