import { useCallback, useEffect, useState } from 'react'
import type { MessageKey } from './i18n'

export default function useNotice(scope = '', initial: MessageKey | null = null) {
  const [notice, setNotice] = useState<{ message: MessageKey; scope: string } | null>(() => initial ? { message: initial, scope } : null)
  const [previousScope, setPreviousScope] = useState(scope)
  if (previousScope !== scope) {
    setPreviousScope(scope)
    setNotice(null)
  }
  const showNotice = useCallback((message: MessageKey | null) => {
    // A new object restarts the timer even for the same message.
    setNotice(message ? { message, scope } : null)
  }, [scope])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])
  return [notice?.scope === scope ? notice.message : null, showNotice] as const
}
