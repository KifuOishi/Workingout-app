import { signedWeight } from './exercises'
import type { PlanItem, SetDetail, WorkoutRecord } from './workouts'

export function workingSets(item: PlanItem): SetDetail[] {
  const sets: SetDetail[] = item.setDetails ?? Array.from({ length: item.sets }, () => ({ weight: item.weight, reps: item.reps }))
  return sets.filter(set => set.type !== 'warmup')
}
export function sameExercise(a: Pick<PlanItem, 'exercise' | 'category'>, b: Pick<PlanItem, 'exercise' | 'category'>) {
  return a.exercise === b.exercise && (a.category ?? '') === (b.category ?? '')
}
export function bests(items: PlanItem[]) {
  const sets = items.flatMap(item => workingSets(item).map(set => ({ ...set, weight: signedWeight(item.exercise, set.weight) })))
  return { weight: sets.length ? Math.max(...sets.map(set => set.weight)) : 0, reps: Math.max(0, ...sets.map(set => set.reps)), count: sets.length }
}
export function recordPR(record: WorkoutRecord, records: WorkoutRecord[]) {
  const before = records.filter(other => sameExercise(record, other) && (other.date < record.date || other.date === record.date && (other.finishedAt ?? 0) < (record.finishedAt ?? 0)))
  const prior = bests(before), current = bests([record])
  return current.count > 0 && (prior.count === 0 || current.weight > prior.weight || current.reps > prior.reps)
}
export function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const next = [...items], target = index + offset
  if (target < 0 || target >= items.length) return next
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
