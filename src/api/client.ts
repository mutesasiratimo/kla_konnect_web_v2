import type { LoginResponse, UploadFileRead, UploadFileKind } from './types'

const STORAGE_KEY = 'dmmp_token'
const SESSION_KEY = 'dmmp_session'

export type StoredSession = {
  access_token: string
  refresh_token: string
  user: LoginResponse['user']
  role?: LoginResponse['role'] | null
  permissions?: Record<string, boolean> | null
  lastActivityAt: number
}

/**
 * API origin for JSON and upload requests.
 * - If `VITE_API_URL` is set, it wins (use for production or a custom dev backend URL).
 * - In dev, default to the current page origin so requests go through the Vite proxy
 *   (`/api` → backend) and avoid browser CORS. Override with VITE_API_URL if needed.
 */
const getBaseUrl = (): string => {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (env) return env.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin
    }
    return 'http://localhost:5173'
  }
  return 'http://109.123.241.160:8041'
  // return 'http://localhost:8041'  
}

export function getToken(): string | null {
  const session = getSession()
  return session?.access_token ?? null
}

export function getRefreshToken(): string | null {
  const session = getSession()
  return session?.refresh_token ?? null
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function setSession(data: {
  access_token: string
  refresh_token: string
  user: LoginResponse['user']
  role?: LoginResponse['role'] | null
  permissions?: Record<string, boolean> | null
}): void {
  const session: StoredSession = {
    ...data,
    lastActivityAt: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(STORAGE_KEY, data.access_token)
}

export function updateSessionTokens(tokens: {
  access_token: string
  refresh_token?: string
}): void {
  const session = getSession()
  if (!session) return
  const updated: StoredSession = {
    ...session,
    access_token: tokens.access_token,
    ...(tokens.refresh_token != null && { refresh_token: tokens.refresh_token }),
    lastActivityAt: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  localStorage.setItem(STORAGE_KEY, tokens.access_token)
}

/** Update last activity timestamp (for inactivity timeout) */
export function touchSession(): void {
  const session = getSession()
  if (!session) return
  const updated: StoredSession = { ...session, lastActivityAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SESSION_KEY)
}

const INACTIVITY_MS = 5 * 60 * 1000 // 5 minutes

export function isSessionExpired(): boolean {
  const session = getSession()
  if (!session) return true
  return Date.now() - session.lastActivityAt > INACTIVITY_MS
}

type RequestOptions = RequestInit & { params?: Record<string, string> }

/** Call refresh endpoint directly (no auth header) to avoid 401 loop */
async function refreshAccessToken(): Promise<{ access_token: string; refresh_token?: string }> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')
  const base = getBaseUrl().replace(/\/$/, '')
  const url = `${base}/api/v2/users/refresh`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    const text = await res.text()
    let detail: unknown = text
    try {
      detail = JSON.parse(text)
    } catch {
      // use text
    }
    throw new ApiError(res.status, detail)
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string }
  return data
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const base = getBaseUrl().replace(/\/$/, '')
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base)
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) =>
      url.searchParams.set(k, v),
    )
  }
  const res = await fetch(url.toString(), {
    ...options,
    headers,
  })

  if (res.status === 401 && !isRetry) {
    try {
      const tokens = await refreshAccessToken()
      updateSessionTokens(tokens)
      return apiRequest<T>(path, options, true)
    } catch {
      clearToken()
      const text = await res.text()
      let detail: unknown = text
      try {
        detail = JSON.parse(text)
      } catch {
        // use text
      }
      throw new ApiError(401, detail)
    }
  }

  if (!res.ok) {
    const text = await res.text()
    let detail: unknown = text
    try {
      detail = JSON.parse(text)
    } catch {
      // use text
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** POST multipart /uploads/file — do not set Content-Type (browser sets boundary). */
export async function uploadFile(
  file: File,
  fileType?: UploadFileKind,
  isRetry = false,
): Promise<UploadFileRead> {
  const formData = new FormData()
  formData.append('file', file)
  if (fileType) formData.append('file_type', fileType)

  const base = getBaseUrl().replace(/\/$/, '')
  const url = `${base}/api/v2/uploads/file`
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: formData })

  if (res.status === 401 && !isRetry) {
    try {
      const tokens = await refreshAccessToken()
      updateSessionTokens(tokens)
      return uploadFile(file, fileType, true)
    } catch {
      clearToken()
      const text = await res.text()
      let detail: unknown = text
      try {
        detail = JSON.parse(text)
      } catch {
        // use text
      }
      throw new ApiError(401, detail)
    }
  }

  if (!res.ok) {
    const text = await res.text()
    let detail: unknown = text
    try {
      detail = JSON.parse(text)
    } catch {
      // use text
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<UploadFileRead>
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown) {
    super(`API error ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}
