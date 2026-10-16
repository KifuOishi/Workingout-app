import { test, expect } from '@playwright/test'
import webpush from 'web-push'

async function setup(page, status = 200) {
  const calls = []
  const keys = webpush.generateVAPIDKeys()
  await page.addInitScript(() => {
    Notification.requestPermission = async () => 'granted'
    const subscription = { options: {}, toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } }), unsubscribe: async () => true }
    PushManager.prototype.getSubscription = async () => subscription
    PushManager.prototype.subscribe = async () => subscription
  })
  await page.route('**/.netlify/functions/push', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { enabled: true, publicKey: keys.publicKey, maxSeconds: 840 } })
    const data = route.request().postDataJSON()
    calls.push(data)
    return route.fulfill({ status: data.action === 'schedule' ? status : 200, json: status === 429 && data.action === 'schedule' ? { code: 'free-limit' } : { ok: true } })
  })
  await page.goto('/#/workout')
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  return calls
}
test('reserve, cancel on pause/reset, resume, and do not cancel a natural expiry', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00') })
  const calls = await setup(page)
  await page.getByRole('button', { name: 'Enable notifications', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Notifications enabled', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Start rest', exact: true }).click()
  await expect(page.getByText('Background alert reserved.', { exact: false })).toBeVisible()
  expect(calls.map(call => call.action)).toEqual(['schedule'])
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect.poll(() => calls.map(call => call.action)).toEqual(['schedule', 'cancel'])
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await expect(page.getByText('Background alert reserved.', { exact: false })).toBeVisible()
  expect(calls.map(call => call.action)).toEqual(['schedule', 'cancel', 'schedule'])
  await page.getByRole('button', { name: 'Reset timer', exact: true }).click()
  await expect.poll(() => calls.length).toBe(4)
  expect(calls[3].action).toBe('cancel')
  await page.getByRole('button', { name: 'Start rest', exact: true }).click()
  await expect(page.getByText('Background alert reserved.', { exact: false })).toBeVisible()
  const before = calls.length
  await page.clock.fastForward(121000)
  await expect(page.getByRole('alert')).toContainText('Rest is over')
  expect(calls.length).toBe(before)
  await page.getByRole('button', { name: 'Disable notifications', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Enable notifications', exact: true })).toBeVisible()
})
test('free limit is visible with no paid fallback', async ({ page }) => {
  const calls = await setup(page, 429)
  await page.getByRole('button', { name: 'Enable notifications', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Notifications enabled', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Start rest', exact: true }).click()
  await expect(page.getByText('The free notification limit has been reached.', { exact: false })).toBeVisible()
  expect(calls.filter(call => call.action === 'schedule')).toHaveLength(1)
})
test('iPhone browser tab explains Home Screen requirement', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }))
  await page.goto('/#/workout')
  await page.getByRole('button', { name: 'Start empty workout', exact: true }).click()
  await page.getByRole('button', { name: 'Enable notifications', exact: true }).click()
  await expect(page.getByText('On iPhone/iPad, add LIFT LOG to your Home Screen', { exact: false })).toBeVisible()
})
