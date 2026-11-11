import { API } from 'react-api-state';

export class HttpApi extends API {
  private bearer: string | null = null;

  override set Token(token: string | null) {
    this.bearer = token;
  }

  override async request(method: string, endpoint: string, options: { body?: unknown; headers?: Record<string, string> } = {}): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };
    if (this.bearer) headers.Authorization = `Bearer ${this.bearer}`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 204 && response.ok) return undefined;
    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      throw new Error(`The server returned an invalid response (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      const message = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message : `Request failed (HTTP ${response.status}).`;
      throw Object.assign(new Error(message), { status: response.status });
    }
    return data;
  }
}
