import { signedWeight } from './exercises'
import type { WorkoutRecord, WorkoutReflection, WorkoutFeeling } from './workouts'
import { workoutVolume, workoutFeelings } from './workouts'
import { fromKg, locales } from './i18n'
import type { Language, Translate, Unit } from './i18n'
import { exerciseLabel } from './exerciseLabels'

export default function WorkoutSummary({ records, language, unit, t, onClose, onReflectionChange }: { records: WorkoutRecord[]; language: Language; unit: Unit; t: Translate; onClose: () => void; onReflectionChange: (reflection: WorkoutReflection) => void }) {
  const first = records[0]
  const seconds = first.durationSeconds ?? 0
  const num = (value: number) => value.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  return <section className="workout-summary" aria-label={t('workoutSummary')}>
    <div className="summary-heading"><div><span className="eyebrow">LIFT LOG / COMPLETE</span><h2>{t('workoutSummary')}</h2>{first.workoutName && !first.workoutName.startsWith('__') && <p>{first.workoutName}</p>}</div><button className="secondary" onClick={onClose}>{t('close')}</button></div>
    <div className="summary-stats"><div><span>{t('totalTime')}</span><strong className="summary-duration">{String(Math.floor(seconds / 3600)).padStart(2, '0')}:{String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></div><div><span>{t('sets')}</span><strong>{num(records.reduce((total, record) => total + record.sets, 0))}</strong></div><div><span>{t('totalVolume')}</span><strong>{num(fromKg(records.reduce((total, record) => total + workoutVolume(record), 0), unit))}<small> {unit}</small></strong></div></div>
    <p className="hint">{t('summaryTimeHint')}</p>
    <section className="workout-reflection" aria-label={t('workoutReflection')}><h3>{t('workoutReflection')} <span className="optional">{t('optional')}</span></h3><p className="hint">{t('reflectionHint')}</p><label>{t('feeling')}<select aria-label={t('feeling')} value={first.feeling ?? ''} onChange={event => onReflectionChange({ feeling: (event.target.value || undefined) as WorkoutFeeling | undefined, workoutNote: first.workoutNote })}><option value="">{t('optional')}</option>{workoutFeelings.map(feeling => <option key={feeling} value={feeling}>{t(feeling)}</option>)}</select></label><label>{t('workoutNote')}<textarea aria-label={t('workoutNote')} rows={3} maxLength={500} value={first.workoutNote ?? ''} placeholder={t('reflectionPlaceholder')} onChange={event => onReflectionChange({ feeling: first.feeling, workoutNote: event.target.value || undefined })} /></label></section>
    <div className="summary-exercises">{records.map(record => <article key={record.id}><h3>{exerciseLabel(record.exercise, language)}</h3>{record.setDetails?.map((set, index) => <p key={index}><span>{t('set')} {index + 1}{set.type && set.type !== 'normal' && <> ({t(set.type)})</>}</span><strong>{num(fromKg(signedWeight(record.exercise, set.weight), unit))} {unit} × {num(set.reps)} {t('reps')}</strong></p>)}{record.note && <p className="record-note">{record.note}</p>}</article>)}</div>
  </section>
}
