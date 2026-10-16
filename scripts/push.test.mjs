import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAILY_LIMIT, MONTHLY_SECONDS, deliverJob, enabled, reserveBudget, sign, validSignature, validateSubscription } from '../netlify/lib/push.mjs'
import handler from '../netlify/functions/push.mjs'
import vm from 'node:vm'
import fs from 'node:fs/promises'

class Store {
  entries = new Map()
  revision = 0
  async getWithMetadata(key) { const current = this.entries.get(key); return current ? structuredClone(current) : null }
  async setJSON(key, value, options = {}) {
    const old = this.entries.get(key)
    if (options.onlyIfNew && old || options.onlyIfMatch && old?.etag !== options.onlyIfMatch) return { modified: false }
    const etag = String(++this.revision)
    this.entries.set(key, { data: structuredClone(value), etag })
    return { modified: true, etag }
  }
}
const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } }
test('disabled unless free-plan acknowledgement and all keys are configured', async () => {
  assert.equal(enabled(), false)
  const response = await handler(new Request('https://example.com/.netlify/functions/push'))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).code, 'not-configured')
})
test('accept known push providers only, reject local targets and malformed keys', () => {
  assert.equal(validateSubscription(subscription), true)
  for (const endpoint of ['http://fcm.googleapis.com/test', 'https://127.0.0.1/test', 'https://fcm.googleapis.com.attacker.test/test', 'https://fcm.googleapis.com:8443/test', 'https://user@fcm.googleapis.com/test']) assert.equal(validateSubscription({ ...subscription, endpoint }), false)
  assert.equal(validateSubscription({ ...subscription, keys: { auth: 'bad', p256dh: 'bad' } }), false)
})
test('daily and monthly reservation limits reject further work', async () => {
  const db = new Store()
  const now = Date.parse('2026-10-15T00:00:00Z')
  for (let i = 0; i < DAILY_LIMIT; i++) assert.equal(await reserveBudget(db, 120, now), true)
  assert.equal(await reserveBudget(db, 120, now), false)
  const db2 = new Store()
  await db2.setJSON('budget/2026-10', { seconds: MONTHLY_SECONDS - 60, days: {} })
  assert.equal(await reserveBudget(db2, 120, now), false)
})
test('concurrent requests cannot exceed the daily cap', async () => {
  const db = new Store()
  const now = Date.parse('2026-10-15T00:00:00Z')
  await db.setJSON('budget/2026-10', { seconds: 0, days: { '2026-10-15': DAILY_LIMIT - 1 } })
  const reservations = await Promise.all(Array.from({ length: 8 }, () => reserveBudget(db, 120, now)))
  assert.equal(reservations.filter(Boolean).length, 1)
})
test('signed jobs cannot be forged or edited', () => {
  process.env.VAPID_PRIVATE_KEY = 'test-key-only'
  const signature = sign('job')
  assert.equal(validSignature('job', signature), true)
  assert.equal(validSignature('different job', signature), false)
  assert.equal(validSignature('job', 'invalid'), false)
  delete process.env.VAPID_PRIVATE_KEY
})
test('one delivery only, no early, canceled, replaced or stale delivery', async () => {
  const db = new Store()
  const sent = []
  const send = async (...args) => sent.push(args)
  const job = { id: 'first', subscription, body: 'Rest is over', endAt: 1000 }
  await db.setJSON('device/test', job)
  assert.equal(await deliverJob(db, 'device/test', 'first', send, 999), false)
  assert.equal(await deliverJob(db, 'device/test', 'first', send, 1000), true)
  assert.equal(await deliverJob(db, 'device/test', 'first', send, 1001), false)
  assert.equal(sent.length, 1)
  await db.setJSON('device/test', { ...job, id: 'replacement' })
  assert.equal(await deliverJob(db, 'device/test', 'first', send, 1001), false)
  await db.setJSON('device/test', { id: null })
  assert.equal(await deliverJob(db, 'device/test', 'replacement', send, 1001), false)
  await db.setJSON('device/test', job)
  assert.equal(await deliverJob(db, 'device/test', 'first', send, 121001), false)
  assert.equal((await db.getWithMetadata('device/test')).data.subscription, undefined)
})

test('service worker displays a push and opens the workout when tapped', async () => {
  const handlers = new Map()
  const notifications = []
  const navigations = []
  let focused = false
  let closed = false
  const self = {
    addEventListener: (name, handler) => handlers.set(name, handler),
    registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
    location: { origin: 'https://lift.example' },
    clients: { matchAll: async () => [{ url: 'https://lift.example/#/home', navigate: async url => navigations.push(url), focus: async () => { focused = true } }] },
  }
  vm.runInNewContext(await fs.readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL })
  let done
  handlers.get('push')({ data: { json: () => ({ body: 'Rest is over', endAt: 1234 }) }, waitUntil: promise => { done = promise } })
  await done
  assert.equal(notifications[0].title, 'LIFT LOG')
  assert.equal(notifications[0].options.tag, 'lift-rest-1234')
  assert.equal(notifications[0].options.body, 'Rest is over')
  handlers.get('notificationclick')({ notification: { close: () => { closed = true } }, waitUntil: promise => { done = promise } })
  await done
  assert.equal(closed, true)
  assert.equal(focused, true)
  assert.deepEqual(navigations, ['/#/workout'])
})
