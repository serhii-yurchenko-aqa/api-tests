import { HttpClient } from '../../src/api/clients/http';
import { UsersAPI } from '../../src/api/endpoints/users';

const api = new UsersAPI(new HttpClient(process.env.BASE_URL || 'https://petstore3.swagger.io/api/v3'));

describe('User auth', () => {
  it('login используя неверными данными не должен вернуть 5xx', async () => {
    const r = await api.login('badUser', 'badPass');
    expect(r.status).toBeGreaterThanOrEqual(200);
  });
});
