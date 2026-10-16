self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data
    try { data = event.data.json() } catch { return }
    if (typeof data.body !== 'string' || typeof data.endAt !== 'number') return
    await self.registration.showNotification('LIFT LOG', { body: data.body, icon: '/app-icon-192.png', badge: '/app-icon-192.png', tag: `lift-rest-${data.endAt}`, data: { url: '/#/workout' }, requireInteraction: false })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)
    if (existing) { await existing.navigate('/#/workout'); await existing.focus() }
    else await self.clients.openWindow('/#/workout')
  })())
})
