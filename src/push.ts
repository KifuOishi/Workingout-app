const preferenceKey = 'workingout.push.enabled.v1'
const tokenKey = 'workingout.push.token.v1'
const jobKey = 'workingout.push.job.v1'
export type PushFailure = 'pushInstall' | 'pushNotConfigured' | 'pushLimit' | 'pushFailed' | 'pushTooLong' | 'alertsUnavailable'
export class PushError extends Error {
  code: PushFailure
  constructor(code: PushFailure) { super(code); this.code = code }
}
export function pushEnabled() { try { return localStorage.getItem(preferenceKey) === 'true' } catch { return false } }
function token() {
  let value = localStorage.getItem(tokenKey)
  if (!value) { value = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join(''); localStorage.setItem(tokenKey, value) }
  return value
}
async function api(body?: object) {
  let response: Response
  try { response = await fetch('/.netlify/functions/push', { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) }) }
  catch { throw new PushError('pushFailed') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new PushError(data.code === 'not-configured' || response.status === 404 ? 'pushNotConfigured' : data.code === 'free-limit' ? 'pushLimit' : 'pushFailed')
  return data
}
export async function enablePush() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (ios && !matchMedia('(display-mode: standalone)').matches && !(navigator as Navigator & { standalone?: boolean }).standalone) throw new PushError('pushInstall')
  if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) throw new PushError('alertsUnavailable')
  // Permission must be requested during the user's click, before network awaits.
  const permission = Notification.requestPermission()
  if (await permission !== 'granted') throw new PushError('alertsUnavailable')
  const config = await api()
  if (!config.enabled || typeof config.publicKey !== 'string') throw new PushError('pushNotConfigured')
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  const bytes = Uint8Array.from(atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0))
  let subscription = await registration.pushManager.getSubscription()
  if (subscription?.options.applicationServerKey) {
    const old = new Uint8Array(subscription.options.applicationServerKey)
    if (old.length !== bytes.length || old.some((byte, index) => byte !== bytes[index])) { await subscription.unsubscribe(); subscription = null }
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes })
  token()
  localStorage.setItem(preferenceKey, 'true')
}
let queue = Promise.resolve()
export function syncRestPush(endAt: number | null, body: string): Promise<void> {
  const task = queue.catch(() => {}).then(async () => {
    if (!pushEnabled()) return
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!registration) throw new PushError('pushFailed')
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) throw new PushError('pushFailed')
    const previous = JSON.parse(localStorage.getItem(jobKey) ?? 'null') as { id: string; endAt: number; confirmed?: boolean } | null
    if (previous?.confirmed && endAt === previous.endAt && endAt > Date.now()) return
    if (previous) {
      await api({ action: 'cancel', token: token(), subscription: subscription.toJSON(), id: previous.id })
      localStorage.removeItem(jobKey)
      const notifications = await registration.getNotifications({ tag: `lift-rest-${previous.endAt}` })
      notifications.forEach(notification => notification.close())
    }
    if (!endAt || endAt <= Date.now()) return
    if (endAt - Date.now() > 840000) throw new PushError('pushTooLong')
    const job = { id: crypto.randomUUID(), endAt }
    // Keep the ID even if the request times out; the next action can cancel it.
    localStorage.setItem(jobKey, JSON.stringify(job))
    await api({ action: 'schedule', token: token(), subscription: subscription.toJSON(), ...job, body })
    localStorage.setItem(jobKey, JSON.stringify({ ...job, confirmed: true }))
  })
  queue = task
  return task
}
export async function disablePush() {
  await syncRestPush(null, '')
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  await subscription?.unsubscribe()
  localStorage.removeItem(preferenceKey)
  localStorage.removeItem(jobKey)
}
