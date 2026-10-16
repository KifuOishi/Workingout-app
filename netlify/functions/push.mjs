import { deviceKey, enabled, json, MAX_SECONDS, reserveBudget, sign, store, validateSubscription } from '../lib/push.mjs'

export default async function handler(request) {
  if (!enabled()) return json({ enabled: false, code: 'not-configured' }, 503)
  if (request.method === 'GET') return json({ enabled: true, publicKey: process.env.VAPID_PUBLIC_KEY, maxSeconds: MAX_SECONDS })
  if (request.method !== 'POST') return json({ code: 'method' }, 405)
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ code: 'origin' }, 403)
  try {
    const text = await request.text()
    if (text.length > 8000) return json({ code: 'invalid' }, 400)
    const data = JSON.parse(text)
    if (!/^[a-f0-9]{64}$/.test(data.token) || !validateSubscription(data.subscription)) return json({ code: 'invalid' }, 400)
    const key = deviceKey(data.token, data.subscription.endpoint)
    const db = store()
    if (data.action === 'cancel') {
      // Cancel only the named job, never a newer timer from another request/tab.
      const current = await db.getWithMetadata(key, { type: 'json' })
      if (current?.data.id === data.id) await db.setJSON(key, { id: null }, { onlyIfMatch: current.etag })
      return json({ ok: true })
    }
    const seconds = Math.ceil((data.endAt - Date.now()) / 1000)
    if (data.action !== 'schedule' || !/^[a-f0-9-]{36}$/.test(data.id) || !Number.isFinite(data.endAt) || seconds < 1 || seconds > MAX_SECONDS || typeof data.body !== 'string' || data.body.length > 300) return json({ code: 'invalid' }, 400)
    const existing = await db.get(key, { type: 'json' })
    if (existing?.id === data.id) return json({ ok: true })
    if (!await reserveBudget(db, seconds)) return json({ code: 'free-limit' }, 429)
    await db.setJSON(key, { id: data.id, endAt: data.endAt, body: data.body, subscription: data.subscription })
    const payload = JSON.stringify({ key, id: data.id, endAt: data.endAt })
    const base = process.env.DEPLOY_URL || process.env.URL
    const response = await fetch(new URL('/.netlify/functions/push-deliver-background', base), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lift-Signature': sign(payload) }, body: payload, signal: AbortSignal.timeout(10000) })
    if (response.status !== 202) {
      const current = await db.getWithMetadata(key, { type: 'json' })
      if (current?.data.id === data.id) await db.setJSON(key, { id: null }, { onlyIfMatch: current.etag })
      return json({ code: 'unavailable' }, 503)
    }
    return json({ ok: true })
  } catch { return json({ code: 'unavailable' }, 503) }
}
