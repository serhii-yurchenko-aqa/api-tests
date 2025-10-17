import { HttpClient } from '../../src/api/clients/http';
import { UsersAPI } from '../../src/api/endpoints/users';
import { UserFactory } from '../../src/common/dataFactory';

const api = new UsersAPI(new HttpClient(process.env.BASE_URL || 'https://petstore3.swagger.io/api/v3'));

describe('User CRUD', () => {
  it('создать → прочитать → обновить → удалить', async () => {
    const user = UserFactory.valid();

    const create = await api.createUser(user);
    expect([200]).toContain(create.status);

    const read = await api.getUser(user.username);
    expect([200, 404]).toContain(read.status);

    const upd = await api.updateUser(user.username, { ...user, email: 'upd@mail.com' });
    expect([200, 204, 404]).toContain(upd.status);

    const del = await api.deleteUser(user.username);
    expect([200, 204, 404]).toContain(del.status);
  });
});
