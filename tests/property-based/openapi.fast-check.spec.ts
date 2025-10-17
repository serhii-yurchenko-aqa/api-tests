import { HttpClient } from '../../src/api/clients/http';
import { PetsAPI } from '../../src/api/endpoints/pets';

const api = new PetsAPI(
  new HttpClient(process.env.BASE_URL || 'http://127.0.0.1:8080/api/v3')
);
const uniqueId = () => Math.floor(Date.now() % 1_000_000_000);

const samplePet = (name: string) => ({
  id: uniqueId(),
  name,
  status: 'available',
  category: { id: 1, name: 'Dogs' },
  photoUrls: ['url1', 'url2'],
  tags: [{ id: 1, name: 'tag1' }],
});

describe('Pet API basic (openapi)', () => {
  it('должен создать питомца и вернуть 200 или 201', async () => {
    const payload = samplePet('ExpectedPet');
    const res = await api.addPet(payload);
    expect([200, 201]).toContain(res.status);
    expect(res.data).toHaveProperty('name', payload.name);
  });

  it('должен вернуть 404 для несуществующего питомца', async () => {
    const res = await api.getPet(999999999);
    expect(res.status).toBe(404);
  });

it('должен вернуть ошибку при неверном payload (400 или 422)', async () => {
  const bad = {
    id: 123,
    name: 456,
    status: 'available',
    category: { id: 'x', name: 1 },
    photoUrls: 'url1',
    tags: { id: 'y', name: 2 },
  };
  const res = await api.addPet(bad as any);
  expect([400, 422]).toContain(res.status);
});
});
