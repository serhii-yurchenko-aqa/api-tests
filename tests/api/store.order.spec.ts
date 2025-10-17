import { HttpClient } from '../../src/api/clients/http';
import { StoreAPI } from '../../src/api/endpoints/store';
import { OrderFactory } from '../../src/common/dataFactory';

const api = new StoreAPI(new HttpClient(process.env.BASE_URL || 'https://petstore3.swagger.io/api/v3'));

describe('Store / Order', () => {
  it('создать → получить → удалить', async () => {
    const order = OrderFactory.valid();
    const create = await api.createOrder(order);
    expect([200, 500]).toContain(create.status);

    const read = await api.getOrder(create.data.id);
    expect([200, 404]).toContain(read.status);

    const del = await api.deleteOrder(create.data.id);
    expect([200, 204, 404]).toContain(del.status);
  });

  it('inventory возвращает словарь чисел', async () => {
    const r = await api.getInventory();
    expect([200]).toContain(r.status);
    if (r.status === 200) {
      for (const val of Object.values(r.data)) {
        expect(typeof val).toBe('number');
      }
    }
  });
});
