import { describe, it, expect } from 'vitest';
import { fakeServer, reply, envelope } from '../helpers/http';
import staffOrderService from '../../src/services/staffOrderService';

describe('staffOrderService', () => {
  it('lists orders with the given query', async () => {
    const server = fakeServer((config) =>
      reply(config, 200, { count: 0, next: null, previous: null, results: [] })
    );
    await staffOrderService.list({ status: 'pending', order_type: 'dine_in', page: 2 });
    const [request] = server;
    expect(request.method).toBe('get');
    expect(request.url).toBe('/orders/');
  });

  it('fetches an order by id', async () => {
    const server = fakeServer((config) => reply(config, 200, { id: 42, status: 'pending' }));
    const order = await staffOrderService.get(42);
    expect(order.id).toBe(42);
    expect(server[0].url).toBe('/orders/42/');
  });

  it('posts the new status to update-status', async () => {
    const server = fakeServer((config) => reply(config, 200, { id: 7, status: 'confirmed' }));
    const order = await staffOrderService.updateStatus(7, 'confirmed');
    expect(order.status).toBe('confirmed');
    const [request] = server;
    expect(request.method).toBe('post');
    expect(request.url).toBe('/orders/7/update-status/');
    expect(request.body).toEqual(JSON.stringify({ status: 'confirmed' }));
  });

  it('maps a validation error from update-status', async () => {
    fakeServer((config) =>
      reply(
        config,
        400,
        envelope('VALIDATION_ERROR', 'Invalid transition', {
          status: ['Cannot move from pending to preparing.'],
        })
      )
    );
    await expect(staffOrderService.updateStatus(7, 'preparing')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('cancels an order', async () => {
    const server = fakeServer((config) => reply(config, 200, { id: 7, status: 'cancelled' }));
    const order = await staffOrderService.cancel(7);
    expect(order.status).toBe('cancelled');
    expect(server[0].url).toBe('/orders/7/cancel/');
  });

  it('creates a walk-in order with the given payload', async () => {
    const server = fakeServer((config) => reply(config, 201, { id: 99, status: 'pending' }));
    const payload = {
      order_type: 'dine_in',
      table: 3,
      items: [{ menu_item: 1, quantity: 2 }],
    };
    const order = await staffOrderService.create(payload);
    expect(order.id).toBe(99);
    expect(server[0].body).toEqual(JSON.stringify(payload));
  });
});
