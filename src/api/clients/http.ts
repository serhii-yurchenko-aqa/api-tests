import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../common/config';
import { attachJson, isAllureActive } from '../../common/allure';
import http from 'node:http';
import https from 'node:https';

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string = config.baseURL, timeout = config.timeout) {
    this.client = axios.create({
      baseURL,
      timeout,
      validateStatus: () => true,
      httpAgent: new http.Agent({ keepAlive: false }),
      httpsAgent: new https.Agent({ keepAlive: false }),
      proxy: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    axiosRetry(this.client, {
      retries: config.retries ?? 2,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
      retryCondition: (error) => {
        const status = error.response?.status;
        const networkOrIdempotent = axiosRetry.isNetworkOrIdempotentRequestError(error);
        const serverError = typeof status === 'number' && status >= 500;
        return Boolean(networkOrIdempotent || serverError);
      },
    });
  }

  async request<T = any>(cfg: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const res = await this.client.request<T>(cfg);
    if (isAllureActive()) {
      await attachJson(
        `REQ ${cfg.method?.toString().toUpperCase()} ${cfg.url}`,
        { url: cfg.url, method: cfg.method, data: cfg.data, params: cfg.params }
      );
      await attachJson(
        `RES ${cfg.method?.toString().toUpperCase()} ${cfg.url}`,
        { status: res.status, data: res.data, headers: res.headers }
      );
    }
    return res;
  }
}
