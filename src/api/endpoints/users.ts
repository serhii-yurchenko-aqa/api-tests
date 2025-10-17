import { HttpClient } from '../clients/http';

export class UsersAPI {
  constructor(private http: HttpClient) {}
  createUser(payload: any) { return this.http.request({ method: 'POST', url: '/user', data: payload }); }
  createWithList(payload: any[]) { return this.http.request({ method: 'POST', url: '/user/createWithList', data: payload }); }
  getUser(username: string) { return this.http.request({ method: 'GET', url: `/user/${encodeURIComponent(username)}` }); }
  updateUser(username: string, payload: any) { return this.http.request({ method: 'PUT', url: `/user/${encodeURIComponent(username)}`, data: payload }); }
  deleteUser(username: string) { return this.http.request({ method: 'DELETE', url: `/user/${encodeURIComponent(username)}` }); }
  login(username: string, password: string) { return this.http.request({ method: 'GET', url: '/user/login', params: { username, password } }); }
  logout() { return this.http.request({ method: 'GET', url: '/user/logout' }); }
}
