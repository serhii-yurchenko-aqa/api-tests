import { HttpClient } from '../../src/api/clients/http';
import { PetsAPI } from '../../src/api/endpoints/pets';

const api = new PetsAPI(new HttpClient(process.env.BASE_URL || 'https://petstore3.swagger.io/api/v3'));

describe('Pet search', () => {
  it('поиск по статусу возвращает 200 и массив', async () => {
    const res = await api.findByStatus('available');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
