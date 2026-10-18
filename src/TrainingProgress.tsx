import ProgressSection from './ProgressSection'
import { useState } from 'react'
import ProgressOverview from './ProgressOverview'
import type { Exercise } from './exercises'
import type { WorkoutRecord } from './workouts'
import { groupWorkouts } from './workouts'
import { bests, sameExercise } from './progress'
import { exerciseLabel, categoryLabel } from './exerciseLabels'
import { fromKg, locales } from './i18n'
import type { Language, Translate, Unit } from './i18n'

export default function TrainingProgress({ records, exercises: catalog, language, unit, t }: { records: WorkoutRecord[]; exercises: Exercise[]; language: Language; unit: Unit; t: Translate }) {
  const [selected, setSelected] = useState('')
  const [metric, setMetric] = useState<'weight' | 'reps'>('weight')
  const key = (record: WorkoutRecord) => JSON.stringify([record.exercise, record.category])
  const exercises = records.filter((record, index) => records.findIndex(other => sameExercise(record, other)) === index)
  const exercise = exercises.find(record => key(record) === selected) ?? exercises[0]
  const matching = exercise ? records.filter(record => sameExercise(record, exercise)) : []
  const best = bests(matching)
  const points = groupWorkouts(matching).sort((a, b) => a.records[0].date.localeCompare(b.records[0].date) || (a.records[0].finishedAt ?? 0) - (b.records[0].finishedAt ?? 0)).map(group => ({ date: group.records[0].date, ...bests(group.records) })).filter(point => point.count > 0)
  const value = (point: { weight: number; reps: number }) => metric === 'weight' ? fromKg(point.weight, unit) : point.reps
  const max = Math.max(0, ...points.map(value))
  const min = Math.min(0, ...points.map(value))
  const range = Math.max(1, max - min)
  const x = (index: number) => points.length === 1 ? 300 : 30 + index * 540 / (points.length - 1)
  const y = (amount: number) => 175 - (amount - min) / range * 140
  const num = (amount: number) => amount.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  return <section className="training-progress panel"><h1>{t('progress')}</h1><ProgressOverview records={records} exercises={catalog} language={language} unit={unit} t={t} /><ProgressSection title={t('exerciseTrends')} className="exercise-trends"><p className="hint">{t('progressHint')}</p>{!exercise ? <p>{t('noProgress')}</p> : <>
    <div className="progress-controls"><label>{t('exercise')}<select value={key(exercise)} onChange={event => setSelected(event.target.value)}>{exercises.map(record => <option key={key(record)} value={key(record)}>{exerciseLabel(record.exercise, language)}{record.category ? ` / ${categoryLabel(record.category, language)}` : ''}</option>)}</select></label><label>{t('progress')}<select value={metric} onChange={event => setMetric(event.target.value as 'weight' | 'reps')}><option value="weight">{t('weight')} ({unit})</option><option value="reps">{t('reps')}</option></select></label></div>
    <div className="pr-stats"><span>{t('personalBest')}<strong>{num(fromKg(best.weight, unit))} {unit}</strong></span><span>{t('personalBest')} · {t('reps')}<strong>{best.reps}</strong></span></div>
    {points.length > 0 ? <><svg className="progress-chart" viewBox="0 0 600 210" role="img" aria-label={`${t('progress')}: ${exerciseLabel(exercise.exercise, language)} (${metric === 'weight' ? unit : t('reps')})`}><line x1="30" y1="175" x2="570" y2="175" stroke="#b4c7a5" /><text x="30" y="20">{num(max)} {metric === 'weight' ? unit : t('reps')}</text><text x="30" y="190">{num(min)}</text><polyline fill="none" stroke="#39764d" strokeWidth="3" points={points.map((point, index) => `${x(index)},${y(value(point))}`).join(' ')} />{points.map((point, index) => <circle key={index} cx={x(index)} cy={y(value(point))} r="5" fill="#39764d"><title>{`${point.date}: ${num(value(point))}`}</title></circle>)}<text x="30" y="202">{points[0].date}</text><text x="570" y="202" textAnchor="end">{points.at(-1)?.date}</text></svg><div className="progress-table"><table><thead><tr><th>{t('date')}</th><th>{t('weight')} ({unit})</th><th>{t('reps')}</th></tr></thead><tbody>{points.map((point, index) => <tr key={index}><td>{point.date}</td><td>{num(fromKg(point.weight, unit))}</td><td>{point.reps}</td></tr>)}</tbody></table></div></> : <p>{t('noProgress')}</p>}
  </>}</ProgressSection></section>
}
