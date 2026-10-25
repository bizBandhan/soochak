class API {
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

// Export as singleton instance
const api = new API();
const $ = (id) => document.getElementById(id);
let registration;
let vapidPublicKey;

function log(message) {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  $('activityLog').prepend(item);
}
function setText(id, value) { $(id).textContent = value; }

function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function refreshStatus() {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  setText('supportStatus', supported ? 'Supported' : 'Not supported');
  setText('permissionStatus', 'Notification' in window ? Notification.permission : 'Unavailable');
  if (!supported) {
    $('subscribeBtn').disabled = true;
    $('subscriptionHint').textContent = 'Use a supported browser and HTTPS (or localhost).';
    return;
  }
  registration = registration || await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  setText('subscriptionStatus', subscription ? 'Subscribed' : 'Not subscribed');
  $('subscribeBtn').disabled = Boolean(subscription);
  $('unsubscribeBtn').disabled = !subscription;
}

async function init() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    await refreshStatus();
    log('This browser does not support the required Push APIs.');
    return;
  }
  try {
    registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    // const config = await api('/api/config');
    let resp = await api.get(`/api/v1/web-push/subscriber-config`);
    if (!resp || !resp.data) throw new Error("Misconfigured")
    vapidPublicKey = resp.data;
    await refreshStatus();
    await refreshCount();
    log('Service worker registered.');
  } catch (error) {
    log(`Startup failed: ${error.message}`);
  }
}

async function subscribe() {
  try {
    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked in browser settings. Allow them for this site, then retry.');
    }
    const permission = await Notification.requestPermission();
    setText('permissionStatus', permission);
    if (permission !== 'granted') throw new Error('Notification permission was not granted.');
    const reg = registration || await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidPublicKey)
      });
    }
    let resp = await api.put(
      `/api/v1/web-push/subscribe`,
      subscription
    )
    console.log(resp);
    await refreshStatus();
    await refreshCount();
    log('Browser subscribed and subscription saved to MongoDB.');
  } catch (error) {
    log(`Subscribe failed: ${error.message}`);
  }
}

async function unsubscribe() {
  try {
    const reg = registration || await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;
    await api.delete('/api/v1/web-push/subscribe', subscription);
    await subscription.unsubscribe();
    await refreshStatus();
    await refreshCount();
    log('Browser unsubscribed and server record removed.');
  } catch (error) {
    log(`Unsubscribe failed: ${error.message}`);
  }
}

async function refreshCount() {
  try {
    const resp = await api.get('/api/v1/web-push/subscribe');
    setText('subscriberCount', `Saved subscriptions: ${resp.data.length}`);
  } catch (error) {
    setText('subscriberCount', 'Saved subscriptions: unavailable');
  }
}

async function sendNotification() {
  // const apiKey = window.prompt('Enter the DEMO_API_KEY configured in your server .env file:');
  // if (!apiKey) return;
  const api=new API();
  const title = $('title').value.trim();
  const body = $('body').value.trim();
  const url = $('targetUrl').value.trim() || '/';
  if (!url.startsWith('/') || url.startsWith('//')) {
    log('Destination must be a same-site path beginning with one slash.');
    return;
  }
  $('sendBtn').disabled = true;
  try {
    let resp = await api.put(`/api/v1/web-push/note`, {
      title,
      body,
      url,
      tag:"Website Notification (Test)"
    })
    // const result = await api('/api/notifications/send', {
    //   method: 'POST',
    //   headers: { 'x-demo-api-key': apiKey },
    //   body: JSON.stringify({ title, body, url })
    // });
    log(`Push request finished: attempted ${result.attempted}, accepted ${result.sent}, expired removed ${result.removedExpired}, failed ${result.failed}.`);
    await refreshCount();
  } catch (error) {
    log(`Send failed: ${error.message}`);
  } finally {
    $('sendBtn').disabled = false;
  }
}

$('subscribeBtn').addEventListener('click', subscribe);
$('unsubscribeBtn').addEventListener('click', unsubscribe);
$('sendBtn').addEventListener('click', sendNotification);
init();
