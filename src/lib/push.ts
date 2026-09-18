import { buildPushPayload } from '@block65/webcrypto-web-push'
import type { Bindings } from './types'

export type PushPayload = { title: string; body: string; url: string; tag: string }
export type PushRow = { id: number; endpoint: string; p256dh: string; auth: string; fail_count: number }
export type PushResult = { sent: number; failed: number; removed: number; skipped?: string }

type PushEnv = Pick<Bindings, 'VAPID_PUBLIC_KEY' | 'VAPID_PRIVATE_KEY' | 'VAPID_SUBJECT'>
const MAX_FAILS = 5

export function pushConfigured(env: PushEnv) {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT)
}

// Sends one payload to every row. Never throws: each delivery is settled independently and
// DB bookkeeping errors are swallowed so a push problem can never affect the caller.
export async function sendPushTo(env: PushEnv, db: D1Database, rows: PushRow[], payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, removed: 0 }
  if (!pushConfigured(env)) return { ...result, skipped: 'vapid-not-configured' }
  if (!rows.length) return result
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
  const outcomes = await Promise.allSettled(rows.map(async row => {
    const built = await buildPushPayload({ data: payload, options: { ttl: 3600, urgency: 'high' } }, { endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } }, vapid)
    const res = await fetch(row.endpoint, { method: 'POST', headers: built.headers, body: built.body, signal: AbortSignal.timeout(10000) })
    return res.status
  }))
  const statements: D1PreparedStatement[] = []
  outcomes.forEach((o, i) => {
    const row = rows[i]
    const status = o.status === 'fulfilled' ? o.value : 0
    if (status >= 200 && status < 300) {
      result.sent++
      statements.push(db.prepare('UPDATE push_subscriptions SET last_ok_at=CURRENT_TIMESTAMP, fail_count=0 WHERE id=?').bind(row.id))
    } else if (status === 404 || status === 410) {
      result.removed++
      statements.push(db.prepare('DELETE FROM push_subscriptions WHERE id=?').bind(row.id))
    } else {
      result.failed++
      if (row.fail_count + 1 >= MAX_FAILS) { result.removed++; statements.push(db.prepare('DELETE FROM push_subscriptions WHERE id=?').bind(row.id)) }
      else statements.push(db.prepare('UPDATE push_subscriptions SET fail_count=fail_count+1 WHERE id=?').bind(row.id))
      if (o.status === 'rejected') console.warn('[push] delivery failed', row.id, String(o.reason?.message || o.reason))
      else console.warn('[push] push service responded', status, row.id)
    }
  })
  try { if (statements.length) await db.batch(statements) } catch (e: any) { console.warn('[push] bookkeeping failed', e?.message) }
  return result
}

export async function loadPushRows(db: D1Database, endpoint?: string | null) {
  const q = endpoint
    ? db.prepare('SELECT id,endpoint,p256dh,auth,fail_count FROM push_subscriptions WHERE endpoint=?').bind(endpoint)
    : db.prepare('SELECT id,endpoint,p256dh,auth,fail_count FROM push_subscriptions ORDER BY id')
  return ((await q.all<PushRow>()).results || [])
}

// Called from the reservation request path via waitUntil. Must never reject.
export async function sendReservationPush(env: PushEnv, db: D1Database, payload: PushPayload): Promise<PushResult> {
  try {
    if (!pushConfigured(env)) return { sent: 0, failed: 0, removed: 0, skipped: 'vapid-not-configured' }
    return await sendPushTo(env, db, await loadPushRows(db), payload)
  } catch (e: any) {
    console.warn('[push] sendReservationPush failed', e?.message)
    return { sent: 0, failed: 0, removed: 0, skipped: 'error' }
  }
}
