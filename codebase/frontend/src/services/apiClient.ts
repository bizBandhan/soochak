import { HttpApi } from './httpApi';

export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class SoochakApiClient {
  public api: HttpApi;
  public baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = DEFAULT_API_BASE) {
    this.baseUrl = baseUrl;
    this.api = new HttpApi(baseUrl);
  }

  public setToken(token: string | null) {
    this.token = token;
    this.api.Token = token;
    if (token === null) {
      localStorage.removeItem('soochak_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setBaseUrl(newUrl: string) {
    this.baseUrl = newUrl;
    this.api = new HttpApi(newUrl);
    this.api.Token = this.token;
  }
}

export const apiClient = new SoochakApiClient();
