import ProgressOverview from './ProgressOverview'
import type { Exercise } from './exercises'
import type { WorkoutRecord } from './workouts'
import type { Language, Translate, Unit } from './i18n'

export default function TrainingProgress({ records, exercises, language, unit, t }: { records: WorkoutRecord[]; exercises: Exercise[]; language: Language; unit: Unit; t: Translate }) {
  return <section className="training-progress panel">
    <h1>{t('progress')}</h1>
    <ProgressOverview records={records} exercises={exercises} language={language} unit={unit} t={t} />
  </section>
}
