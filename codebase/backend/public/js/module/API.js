export class API {
    #tokenPath
    #token
    #headers;
    constructor(baseUrl = "", tokenPath = "token") {
        this.#tokenPath = tokenPath;
        this.baseUrl = baseUrl;
    }
    set headers(value) {
        this.#headers = value;
    }
    set Token(token) {
        this.#token = token
    }
    async request(method, endpoint, { body, headers = {} } = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = typeof window !== 'undefined'
            ? localStorage.getItem(this.#tokenPath)
            : null;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${this.#token ?? token}` }),
            ...this.#headers
        };

        const mergedHeaders = {
            ...defaultHeaders,
            ...headers,
        };

        if (body instanceof FormData) {
            delete mergedHeaders['Content-Type'];
        }
        const config = {
            method,
            headers: mergedHeaders,
            credentials: "include"
        };

        if (body && method !== 'GET') {
            config.body = body instanceof FormData ? body : JSON.stringify(body);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                console.log(response)
                errorData = { message: response.statusText };
            }

            document.dispatchEvent(
                new CustomEvent('error-received', {
                    detail: {
                        status: response.status,
                        message: errorData.message
                    },
                })
            )
            return errorData;//throw new Error(errorData.message || 'Request failed');
        }
        return response.json();

    }
    async getHtml(url, config = { mode: "no-cors" }) {
        console.log(url);

        const response = await fetch(url, config);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.log(errorData)
            } catch {

                errorData = { message: response.statusText };
            }

            document.dispatchEvent(
                new CustomEvent('error-received', {
                    detail: {
                        status: response.status,
                        message: errorData.message
                    },
                })
            )
            return errorData;//throw new Error(errorData.message || 'Request failed');
        }
        return await response.text();
    }
    get(endpoint, options = {}) {
        return this.request('GET', endpoint, options);
    }

    post(endpoint, body, options = {}) {
        return this.request('POST', endpoint, { ...options, body });
    }

    put(endpoint, body, options = {}) {
        return this.request('PUT', endpoint, { ...options, body });
    }

    patch(endpoint, body, options = {}) {
        return this.request('PATCH', endpoint, { ...options, body });
    }

    delete(endpoint, body, options = {}) {
        return this.request('DELETE', endpoint, { ...options, body });
    }
    copy(endpoint, body = {}, options = {}) {
        return this.request('COPY', endpoint, { ...options, body });
    }
}
const api = new API();
export default api;