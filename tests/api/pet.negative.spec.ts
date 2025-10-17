import { HttpClient } from '../../src/api/clients/http';
import { PetsAPI } from '../../src/api/endpoints/pets';
import { uniqueId } from '../utils/uniqueId';

const api = new PetsAPI(
  new HttpClient(process.env.BASE_URL || 'http://127.0.0.1:8080/api/v3')
);

describe('Pet negative', () => {
  it('должен вернуть 400/422 при неверных типах полей', async () => {
    const bad = {
      id: uniqueId(),
      name: 123,
      status: 'available',
      category: { id: 'one', name: 42 },
      photoUrls: 'url1',
      tags: { id: 'x', name: 1 },
    };
    const res = await api.addPet(bad as any);
    expect([400, 422]).toContain(res.status);
  });

  it('должен вернуть 400/422 при множественных типовых нарушениях', async () => {
    const bad = {
      id: String(uniqueId()),
      name: 123,
      status: 'broken',
      category: { id: 'x', name: 1 },
      photoUrls: ['url1', 2],
      tags: 'not-an-array',
    };
    const res = await api.addPet(bad as any);
    expect([400, 422]).toContain(res.status);
  });
});
