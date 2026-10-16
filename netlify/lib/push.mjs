import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import webpush from 'web-push'

export const MAX_SECONDS = 840
export const DAILY_LIMIT = 40
export const MONTHLY_SECONDS = 36000
export const enabled = () => process.env.WEB_PUSH_ENABLED === 'true' && process.env.WEB_PUSH_FREE_PLAN_CONFIRMED === 'true' && !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY && /^mailto:[^\s@]+@[^\s@]+$/.test(process.env.VAPID_CONTACT ?? '')
export const store = () => getStore({ name: 'lift-log-push', consistency: 'strong' })
export const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
export const sign = value => createHmac('sha256', process.env.VAPID_PRIVATE_KEY).update(value).digest('hex')
export function validSignature(value, signature) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) return false
  return timingSafeEqual(Buffer.from(sign(value), 'hex'), Buffer.from(signature, 'hex'))
}
export function validateSubscription(subscription) {
  try {
    const url = new URL(subscription.endpoint)
    const host = url.hostname
    const allowed = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host.endsWith('.push.apple.com') || host === 'web.push.apple.com' || host.endsWith('.notify.windows.com')
    return allowed && url.protocol === 'https:' && !url.port && !url.username && !url.password && subscription.endpoint.length < 2048 && /^[A-Za-z0-9_-]{87}=?$/.test(subscription.keys.p256dh) && /^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription.keys.auth)
  } catch { return false }
}
export const deviceKey = (token, endpoint) => 'device/' + createHash('sha256').update(token + endpoint).digest('hex')
export async function reserveBudget(db, seconds, now = Date.now()) {
  const date = new Date(now).toISOString().slice(0, 10)
  const key = 'budget/' + date.slice(0, 7)
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await db.getWithMetadata(key, { type: 'json' })
    const data = current?.data ?? { seconds: 0, days: {} }
    if ((data.days[date] ?? 0) >= DAILY_LIMIT || data.seconds + seconds > MONTHLY_SECONDS) return false
    const next = { seconds: data.seconds + seconds, days: { ...data.days, [date]: (data.days[date] ?? 0) + 1 } }
    const result = await db.setJSON(key, next, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true })
    if (result.modified) return true
  }
  return false
}
export async function deliverJob(db, key, id, send = webpush.sendNotification.bind(webpush), now = Date.now()) {
  const current = await db.getWithMetadata(key, { type: 'json' })
  const job = current?.data
  if (!job || job.id !== id || job.endAt > now || !job.subscription) return false
  // Claim before sending, so retries cannot deliver a duplicate notification.
  const claimed = await db.setJSON(key, { id: null }, { onlyIfMatch: current.etag })
  if (!claimed.modified) return false
  if (job.endAt < now - 120000) return false
  await send(job.subscription, JSON.stringify({ title: 'LIFT LOG', body: job.body, id, endAt: job.endAt }), { TTL: 120, urgency: 'high', timeout: 10000, vapidDetails: { subject: process.env.VAPID_CONTACT, publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY } })
  return true
}
