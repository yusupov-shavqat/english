import axios from 'axios'

const TOKEN_KEY = 'english-token'

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

let token = readToken()
let onUnauthorized = () => {}

export function setToken(value) {
  token = value
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage may be blocked; the session then lasts until the tab closes.
  }
}

export function hasToken() {
  return Boolean(token)
}

// Called when the server rejects the token (expired or logged out elsewhere).
export function handleUnauthorized(callback) {
  onUnauthorized = callback
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const http = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  timeout: 60000,
})

http.interceptors.request.use((config) => {
  Object.assign(config.headers, authHeaders())
  return config
})

http.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && token) onUnauthorized()
  return Promise.reject(error)
})

export class ApiError extends Error {}

// ---------- Auth ----------

export async function register(name, username, password) {
  const { data } = await http.post('/auth/register', { name, username, password })
  setToken(data.token)
  return data.user
}

export async function login(username, password) {
  const { data } = await http.post('/auth/login', { username, password })
  setToken(data.token)
  return data.user
}

export async function logout() {
  try {
    await http.post('/auth/logout')
  } finally {
    setToken(null)
  }
}

export async function fetchMe() {
  const { data } = await http.get('/me')
  return data.user
}

// ---------- Conversation ----------

export async function startChat(settings) {
  const { data } = await http.post('/chat/start', {
    level: settings.level,
    topic: settings.topic || null,
    explanation_language: settings.explanationLanguage,
    unit: settings.unit ?? null,
  })
  return data
}

// ---------- Lessons ----------

export async function fetchUnits() {
  const { data } = await http.get('/units')
  return data
}

export async function fetchUnit(slug) {
  const { data } = await http.get(`/units/${slug}`)
  return data
}

// Signed link to hear a word or sentence spoken.
export async function speechUrl(text) {
  const { data } = await http.post('/speech/url', { text })
  return data.url
}

export async function finishChat(conversationId, durationSeconds) {
  const { data } = await http.post(`/chat/${conversationId}/finish`, { duration_seconds: durationSeconds })
  return data // { profile, unit }
}

/**
 * Sends one spoken turn and calls `handlers[type](event)` for each event the server
 * streams back: transcript, reply, check, error.
 */
export async function streamTurn(conversationId, audio, handlers) {
  const form = new FormData()
  form.append('audio', audio.blob, audio.filename)

  const response = await fetch(`/api/chat/${conversationId}/turn`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: form,
  })

  if (response.status === 401) onUnauthorized()
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(body.message ?? "Xatolik yuz berdi. Qayta urinib ko'ring.")
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (value) buffer += value
    const lines = buffer.split('\n')
    buffer = done ? '' : lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      const event = JSON.parse(line)
      handlers[event.type]?.(event)
    }
    if (done) break
  }
}
