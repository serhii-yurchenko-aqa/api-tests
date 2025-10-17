import { HttpClient } from '../clients/http';

export class PetsAPI {
  constructor(private http: HttpClient) {}
  addPet(payload: any) { return this.http.request({ method: 'POST', url: '/pet', data: payload }); }
  getPet(id: number) { return this.http.request({ method: 'GET', url: `/pet/${id}` }); }
  updatePet(payload: any) { return this.http.request({ method: 'PUT', url: '/pet', data: payload }); }
  findByStatus(status: string) { return this.http.request({ method: 'GET', url: '/pet/findByStatus', params: { status } }); }
  deletePet(id: number) { return this.http.request({ method: 'DELETE', url: `/pet/${id}` }); }
}
