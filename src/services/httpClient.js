// ─── HTTP helper with JWT token management ──────────────────────────────────
// Every service uses these helpers to make authenticated requests.

const TOKEN_KEY  = 'eris_token';
const USER_KEY   = 'eris_user';

/** Get the stored JWT token */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Get the stored user object */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

/** Persist token + user after login */
export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clear session on logout */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Check if user is authenticated */
export function isAuthenticated() {
  return !!getToken();
}

// ─── Fetch wrappers ──────────────────────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Generic fetch wrapper — attaches Bearer token and handles JSON.
 * Throws on non-ok responses so callers can catch.
 */
async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });

  // 401 means token expired / invalid → auto-logout
  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new Event('eris-logout'));
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { data = text; }

  if (!res.ok) {
    // Spring Boot error responses: { timestamp, status, error, message, path }
    let msg = 'Request failed';
    if (typeof data === 'string') {
      msg = data;
    } else if (data?.message && data.message.trim()) {
      msg = data.message;
    } else if (data?.error && data.error.trim()) {
      msg = data.error;
    }
    throw new Error(msg);
  }
  return data;
}

export async function get(url) {
  return request(url);
}

export async function post(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(body) });
}

export async function put(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

export async function patch(url, body) {
  return request(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export async function del(url) {
  return request(url, { method: 'DELETE' });
}
