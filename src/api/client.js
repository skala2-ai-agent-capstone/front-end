// Dev: proxied through Vite (see vite.config.js) to dodge the backend's missing CORS headers.
// Prod build: needs either backend CORS support or a reverse proxy serving /api from the same origin.
const BASE_URL = '';

// The published Swagger spec shows camelCase, but the backend's actual wire format is snake_case
// (confirmed by hitting /api/auth/login directly). Convert at the boundary so the rest of the app
// can keep using camelCase field names.
const camelToSnake = (str) => str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const snakeToCamel = (str) => str.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function deepTransformKeys(value, transform) {
  if (Array.isArray(value)) return value.map((v) => deepTransformKeys(v, transform));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [transform(k), deepTransformKeys(v, transform)]),
    );
  }
  return value;
}

function getToken() {
  return sessionStorage.getItem('accessToken');
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(deepTransformKeys(body, camelToSnake)) : undefined,
  });

  let rawJson = null;
  try { rawJson = await res.json(); } catch { /* empty body */ }
  const json = rawJson ? deepTransformKeys(rawJson, snakeToCamel) : null;

  if (!res.ok || !json || json.ok === false) {
    const message = json?.error?.message || `요청에 실패했어요 (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = json?.error?.code;
    err.retryAfterSeconds = json?.error?.retryAfterSeconds;
    throw err;
  }
  return json.data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};
