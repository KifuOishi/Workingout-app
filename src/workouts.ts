import { categories } from './exercises'
import type { Category } from './exercises'

export type SetDetail = { weight: number; reps: number }
export type SessionSet = { id: string; weight: number | null; reps: number | null; done: boolean; restSeconds: number }
export type PlanItem = { id: string; exercise: string; category?: Category; weight: number; reps: number; sets: number; note: string; setDetails?: SetDetail[] }
export type Template = { id: string; name: string; restSeconds: number; items: PlanItem[] }
export type Session = Template & { date: string; startedAt: number; setRows: Record<string, SessionSet[]>; completed: string[]; timer: { endAt: number | null; remainingMs: number; ringing: boolean } }
export type PlannerState = { templates: Template[]; session: Session | null }
export const plannerKey = 'workingout.planner.v1'
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const validItem = (r: PlanItem) => r && typeof r.id === 'string' && typeof r.exercise === 'string' && r.exercise.trim().length > 0 && Number.isFinite(r.weight) && r.weight >= 0 && Number.isInteger(r.reps) && r.reps > 0 && Number.isInteger(r.sets) && r.sets > 0 && r.sets <= 1000 && typeof r.note === 'string' && (r.category === undefined || categories.includes(r.category)) && (r.setDetails === undefined || Array.isArray(r.setDetails) && r.setDetails.length === r.sets && r.setDetails.every(set => set && Number.isFinite(set.weight) && set.weight >= 0 && Number.isInteger(set.reps) && set.reps > 0))
export function validTemplate(p: Template, allowEmpty = false): boolean {
  return !!p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0 && Number.isInteger(p.restSeconds) && p.restSeconds >= 0 && p.restSeconds <= 3600 && Array.isArray(p.items) && (allowEmpty || p.items.length > 0) && p.items.every(validItem) && new Set(p.items.map(i => i.id)).size === p.items.length
}
export function readPlanner(raw?: string): { state: PlannerState; error: boolean } {
  try {
    const data = JSON.parse(raw ?? localStorage.getItem(plannerKey) ?? '{"templates":[],"session":null}')
    if (!data || !Array.isArray(data.templates) || !data.templates.every((plan: Template) => validTemplate(plan))) throw new Error()
    if (data.session !== null) {
      const s = data.session
      if (!validTemplate(s, true) || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || !Array.isArray(s.completed) || !s.completed.every((id: unknown) => s.items.some((i: PlanItem) => i.id === id)) || new Set(s.completed).size !== s.completed.length || !s.timer || !(s.timer.endAt === null || (Number.isFinite(s.timer.endAt) && s.timer.endAt > 0)) || !Number.isFinite(s.timer.remainingMs) || s.timer.remainingMs < 0 || typeof s.timer.ringing !== 'boolean') throw new Error()
    }
    if (data.session) {
      const s = data.session as Session
      s.startedAt ??= Date.now()
      s.setRows ??= Object.fromEntries(s.items.map(item => [item.id, makeSets(item, s.restSeconds, s.completed.includes(item.id))]))
      if (!Number.isFinite(s.startedAt) || !s.items.every(item => Array.isArray(s.setRows[item.id]) && s.setRows[item.id].length > 0 && s.setRows[item.id].every(row => typeof row.id === 'string' && typeof row.done === 'boolean' && (row.weight === null || Number.isFinite(row.weight) && row.weight >= 0) && (row.reps === null || Number.isInteger(row.reps) && row.reps > 0) && (!row.done || row.weight !== null && row.reps !== null) && Number.isInteger(row.restSeconds) && row.restSeconds >= 0 && row.restSeconds <= 3600))) throw new Error()
    }
    return { state: data, error: false }
  } catch { return { state: { templates: [], session: null }, error: true } }
}
export function startSession(plan: Template, date = localDate()): Session {
  const items = plan.items.map(item => ({ ...item, id: crypto.randomUUID() }))
  return { ...plan, id: crypto.randomUUID(), items, date, startedAt: Date.now(), setRows: Object.fromEntries(items.map(item => [item.id, makeSets(item, plan.restSeconds)])), completed: [], timer: { endAt: null, remainingMs: 0, ringing: false } }
}
function makeSets(item: PlanItem, restSeconds: number, done = false): SessionSet[] {
  return Array.from({ length: item.setDetails?.length || item.sets }, (_, index) => ({ id: crypto.randomUUID(), weight: item.setDetails?.[index]?.weight ?? item.weight, reps: item.setDetails?.[index]?.reps ?? item.reps, done, restSeconds }))
}
export function workoutVolume(item: PlanItem): number {
  return item.setDetails ? item.setDetails.reduce((sum, set) => sum + set.weight * set.reps, 0) : item.weight * item.reps * item.sets
}
export function remainingTime(timer: Session['timer'], now: number): number {
  return timer.endAt === null ? timer.remainingMs : Math.max(0, timer.endAt - now)
}
export function completedRecords(session: Session) {
  return session.items.flatMap(item => {
    const details = session.setRows[item.id].filter(row => row.done && row.weight !== null && row.reps !== null).map(row => ({ weight: row.weight!, reps: row.reps! }))
    return details.length ? [{ ...item, weight: details[0].weight, reps: details[0].reps, sets: details.length, setDetails: details, id: `session-${session.id}-${item.id}`, date: session.date }] : []
  })
}
