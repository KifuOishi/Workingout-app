import { setTimeout as wait } from 'node:timers/promises'
import { deliverJob, enabled, MAX_SECONDS, store, validSignature } from '../lib/push.mjs'

export default async function handler(request) {
  if (!enabled() || request.method !== 'POST') return
  const payload = await request.text()
  if (payload.length > 1000 || !validSignature(payload, request.headers.get('x-lift-signature'))) return
  const job = JSON.parse(payload)
  const delay = job.endAt - Date.now()
  if (!/^device\/[a-f0-9]{64}$/.test(job.key) || !/^[a-f0-9-]{36}$/.test(job.id) || !Number.isFinite(delay) || delay > MAX_SECONDS * 1000 || delay < -120000) return
  await wait(Math.max(0, delay))
  if (!enabled()) return
  await deliverJob(store(), job.key, job.id)
}
