import { HttpClient } from '../clients/http';

export class StoreAPI {
  constructor(private http: HttpClient) {}
  createOrder(payload: any) { return this.http.request({ method: 'POST', url: '/store/order', data: payload }); }
  getOrder(id: number) { return this.http.request({ method: 'GET', url: `/store/order/${id}` }); }
  deleteOrder(id: number) { return this.http.request({ method: 'DELETE', url: `/store/order/${id}` }); }
  getInventory() { return this.http.request({ method: 'GET', url: '/store/inventory' }); }
}
