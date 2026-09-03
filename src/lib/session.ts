// HMAC-서명 HttpOnly 쿠키 세션 (Web Crypto)
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, SessionUser } from './types'

const enc = new TextEncoder()
const b64u = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64u = (s: string) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function key(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function sign(payload: string, secret: string) {
  const sig = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload))
  return `${b64u(enc.encode(payload))}.${b64u(sig)}`
}
export async function verify(token: string, secret: string): Promise<string | null> {
  const [p, s] = token.split('.')
  if (!p || !s) return null
  const payload = new TextDecoder().decode(unb64u(p))
  const ok = await crypto.subtle.verify('HMAC', await key(secret), unb64u(s), enc.encode(payload))
  return ok ? payload : null
}

const MEMBER_TTL = 60 * 60 * 24 * 30
const ADMIN_TTL = 60 * 60 * 24

export const secretOf = (c: Context<Env>) => c.env.SESSION_SECRET || 'dev-secret-change-me'

export async function setSession(c: Context<Env>, user: SessionUser) {
  const ttl = user.role === 'admin' ? ADMIN_TTL : MEMBER_TTL
  const exp = Math.floor(Date.now() / 1000) + ttl
  const token = await sign(JSON.stringify({ ...user, exp }), secretOf(c))
  const secure = new URL(c.req.url).protocol === 'https:'
  setCookie(c, 'dd_session', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: ttl, secure })
}

export async function readSession(c: Context<Env>): Promise<SessionUser | null> {
  const t = getCookie(c, 'dd_session')
  if (!t) return null
  try {
    const p = await verify(t, secretOf(c))
    if (!p) return null
    const d = JSON.parse(p)
    if (!d.exp || d.exp < Date.now() / 1000) return null
    return { id: d.id, email: d.email, name: d.name, role: d.role }
  } catch {
    return null
  }
}

export const clearSession = (c: Context<Env>) => deleteCookie(c, 'dd_session', { path: '/' })

// 비밀번호 해시 (PBKDF2)
export async function hashPassword(pw: string, salt?: string) {
  salt = salt || b64u(crypto.getRandomValues(new Uint8Array(16)))
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, k, 256)
  return `${salt}$${b64u(bits)}`
}
export async function verifyPassword(pw: string, stored: string) {
  const [salt] = stored.split('$')
  return (await hashPassword(pw, salt)) === stored
}

// 간단 CSRF: 세션 토큰 기반 파생 (폼에 hidden으로 넣고 비교)
export async function csrfToken(c: Context<Env>) {
  const t = getCookie(c, 'dd_session') || 'anon'
  const sig = await crypto.subtle.sign('HMAC', await key(secretOf(c)), enc.encode('csrf:' + t))
  return b64u(sig).slice(0, 24)
}
