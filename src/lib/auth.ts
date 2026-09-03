import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, SessionUser } from './types'

const enc = new TextEncoder()

function b64url(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64url(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export async function signToken(secret: string, payload: Record<string, unknown>, ttlSec: number) {
  const body = b64url(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })))
  const sig = await hmac(secret, body)
  return `${body}.${sig}`
}

export async function verifyToken<T = any>(secret: string, token?: string): Promise<T | null> {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expect = await hmac(secret, body)
  if (sig.length !== expect.length) return null
  // constant-time compare
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expect.charCodeAt(i)
  if (diff) return null
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64url(body)))
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    return data as T
  } catch {
    return null
  }
}

// ── 비밀번호 (PBKDF2-SHA256) ─────────────────────────────
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256)
  return `pbkdf2$100000$${b64url(salt)}$${b64url(bits)}`
}

export async function verifyPassword(pw: string, stored?: string | null) {
  if (!stored) return false
  const [, iter, saltB, hashB] = stored.split('$')
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64url(saltB), iterations: Number(iter) }, key, 256)
  return b64url(bits) === hashB
}

// ── 세션 쿠키 ────────────────────────────────────────────
const MEMBER_COOKIE = 'dd_session'
const ADMIN_COOKIE = 'dd_admin'
const MEMBER_TTL = 60 * 60 * 24 * 30 // 30일
const ADMIN_TTL = 60 * 60 * 24 // 24시간

function secure(c: Context<Env>) {
  return new URL(c.req.url).protocol === 'https:'
}

export async function setMemberSession(c: Context<Env>, user: SessionUser) {
  const token = await signToken(c.env.SESSION_SECRET, { u: user }, MEMBER_TTL)
  setCookie(c, MEMBER_COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: secure(c), path: '/', maxAge: MEMBER_TTL })
}
export function clearMemberSession(c: Context<Env>) {
  deleteCookie(c, MEMBER_COOKIE, { path: '/' })
}
export async function readMemberSession(c: Context<Env>): Promise<SessionUser | null> {
  const data = await verifyToken<{ u: SessionUser }>(c.env.SESSION_SECRET, getCookie(c, MEMBER_COOKIE))
  return data?.u ?? null
}

export async function setAdminSession(c: Context<Env>) {
  const token = await signToken(c.env.SESSION_SECRET, { admin: true }, ADMIN_TTL)
  setCookie(c, ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'Strict', secure: secure(c), path: '/', maxAge: ADMIN_TTL })
}
export function clearAdminSession(c: Context<Env>) {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
}
export async function readAdminSession(c: Context<Env>): Promise<boolean> {
  const data = await verifyToken<{ admin: boolean }>(c.env.SESSION_SECRET, getCookie(c, ADMIN_COOKIE))
  return !!data?.admin
}

// ── OAuth state (짧은 수명) ───────────────────────────────
export async function makeState(secret: string, next: string) {
  return signToken(secret, { n: next, r: b64url(crypto.getRandomValues(new Uint8Array(8))) }, 600)
}
export async function readState(secret: string, state?: string) {
  return verifyToken<{ n: string }>(secret, state)
}

export const isBot = (ua = '') =>
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|gtmetrix|yeti|daum|bingpreview|curl|wget|python-requests/i.test(ua)
