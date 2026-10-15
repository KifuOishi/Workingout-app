export type Page = 'home' | 'workout' | 'templates' | 'history'
export const pages: Page[] = ['home', 'workout', 'templates', 'history']
export function readPage(): Page {
  const hash = typeof window === 'undefined' ? '' : window.location.hash.slice(2)
  return pages.includes(hash as Page) ? hash as Page : 'home'
}
