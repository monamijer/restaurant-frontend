import { describe, it, expect } from 'vitest';
import { fakeServer, reply, envelope } from '../helpers/http';
import staffPaymentService from '../../src/services/staffPaymentService';

describe('staffPaymentService', () => {
  it('lists the payments of an order newest first', async () => {
    const server = fakeServer(() =>
      reply(200, { count: 0, next: null, previous: null, results: [] })
    );
    await staffPaymentService.listForOrder(5);
    const [request] = server;
    expect(request.url).toBe('/payments/');
    expect(request.params).toEqual({ order: 5, ordering: '-created_at' });
  });

  it('confirms a cash payment', async () => {
    const server = fakeServer(() => reply(200, { id: 12, status: 'paid', method: 'cash' }));
    const payment = await staffPaymentService.confirm(12);
    expect(payment.status).toBe('paid');
    expect(server[0].url).toBe('/payments/12/confirm/');
  });

  it('maps a conflict error from confirm', async () => {
    fakeServer(() =>
      reply(409, envelope('CONFLICT', 'Payment not pending', {}))
    );
    await expect(staffPaymentService.confirm(12)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });
});
