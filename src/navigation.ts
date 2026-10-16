export type Page = 'home' | 'workout' | 'templates' | 'calendar' | 'history' | 'progress'
export const pages: Page[] = ['home', 'workout', 'templates', 'calendar', 'history', 'progress']
export function readPage(): Page {
  const hash = typeof window === 'undefined' ? '' : window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '')
  return pages.includes(hash as Page) ? hash as Page : 'home'
}
export function readHistoryDate(): string {
  if (typeof window === 'undefined' || readPage() !== 'history') return ''
  const date = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('date') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ''
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isFinite(parsed.getTime()) && `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` === date ? date : ''
}
