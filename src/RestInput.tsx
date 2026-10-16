import { useState } from 'react'

export default function RestInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  return <input type="number" min="0" max="3600" step="1" inputMode="numeric" aria-label={label}
    value={draft ?? value}
    onFocus={() => setDraft(String(value))}
    onChange={event => {
      const text = event.target.value
      setDraft(text)
      if (text === '') { onChange(0); return }
      const next = Number(text)
      if (Number.isInteger(next) && next >= 0 && next <= 3600) onChange(next)
    }}
    onBlur={() => setDraft(null)} />
}
