import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

type Drag = { pointer: number; y: number; x: number; startX: number; startY: number; moved: boolean; target: string; frame: number; handle: HTMLButtonElement; list: HTMLElement; minHeight: string }
export default function ExerciseDragHandle({ id, label, onDrop }: { id: string; label: string; onDrop: (from: string, to: string) => void }) {
  const drag = useRef<Drag | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragging = position !== null
  function cleanup(restore = false) {
    const current = drag.current
    if (!current) return
    cancelAnimationFrame(current.frame)
    current.list.querySelectorAll('.drag-target').forEach(element => element.classList.remove('drag-target'))
    current.list.classList.remove('is-dragging-exercise')
    current.list.style.minHeight = current.minHeight
    drag.current = null
    if (current.handle.hasPointerCapture(current.pointer)) current.handle.releasePointerCapture(current.pointer)
    if (restore) requestAnimationFrame(() => { if (current.handle.isConnected) current.handle.closest('.live-exercise')?.scrollIntoView({ block: 'nearest' }) })
  }
  useEffect(() => () => cleanup(), [])
  useEffect(() => {
    if (!dragging) return
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') { cleanup(true); setPosition(null) } }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [dragging])
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return
    const handle = event.currentTarget
    const list = handle.closest<HTMLElement>('.set-exercises')
    if (!list) return
    event.preventDefault()
    handle.setPointerCapture(event.pointerId)
    const top = handle.getBoundingClientRect().top
    const minHeight = list.style.minHeight
    list.style.minHeight = `${list.getBoundingClientRect().height}px`
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, target: id, frame: 0, handle, list, minHeight }
    list.classList.add('is-dragging-exercise')
    window.scrollBy(0, handle.getBoundingClientRect().top - top)
    setPosition({ x: event.clientX, y: event.clientY })
    const tick = () => {
      const current = drag.current
      if (!current) return
      // Scroll near the viewport edges so long workouts can be reordered on a phone.
      const edge = 100
      const speed = current.y < edge ? -Math.min(18, (edge - current.y) / 5) : current.y > innerHeight - edge ? Math.min(18, (current.y - innerHeight + edge) / 5) : 0
      if (speed && current.moved) window.scrollBy(0, speed)
      let distance = Infinity
      for (const element of current.list.querySelectorAll<HTMLElement>('[data-exercise-id]')) {
        const rect = element.querySelector('.exercise-heading')!.getBoundingClientRect()
        const nextDistance = Math.abs(current.y - (rect.top + rect.height / 2))
        if (current.moved && nextDistance < distance) { distance = nextDistance; current.target = element.dataset.exerciseId! }
      }
      for (const element of current.list.querySelectorAll<HTMLElement>('[data-exercise-id]')) element.classList.toggle('drag-target', element.dataset.exerciseId === current.target)
      current.frame = requestAnimationFrame(tick)
    }
    drag.current.frame = requestAnimationFrame(tick)
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    const target = current.target
    cleanup(true)
    setPosition(null)
    if (!cancelled && target !== id) onDrop(id, target)
  }
  return <><button type="button" className="exercise-drag-handle" aria-label={label} title={label} onPointerDown={start} onPointerMove={event => {
    if (drag.current?.pointer === event.pointerId) { drag.current.x = event.clientX; drag.current.y = event.clientY; drag.current.moved ||= Math.hypot(event.clientX - drag.current.startX, event.clientY - drag.current.startY) > 4; setPosition({ x: event.clientX, y: event.clientY }) }
  }} onPointerUp={event => end(event, false)} onPointerCancel={event => end(event, true)} onLostPointerCapture={event => end(event, true)}><span aria-hidden="true">⠿</span></button>{position && <div className="exercise-drag-preview" style={{ left: Math.max(12, Math.min(position.x, window.innerWidth - 190)), top: Math.max(12, Math.min(position.y - 56, window.innerHeight - 120)) }} aria-hidden="true">{label}</div>}</>
}
