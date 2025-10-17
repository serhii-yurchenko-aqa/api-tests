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

describe('Pet CRUD', () => {
  it('создать → получить → обновить → удалить', async () => {
    const pet = samplePet('Fido');
    const created = await api.addPet(pet);
    expect([200, 201]).toContain(created.status);

    const get = await api.getPet(created.data.id);
    expect(get.status).toBe(200);

    const upd = await api.updatePet({ ...created.data, name: 'Fido_updated' });
    expect([200, 204]).toContain(upd.status);

    const del = await api.deletePet(created.data.id);
    expect([200, 204]).toContain(del.status);
  });
});
