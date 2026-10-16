import { isAssisted, signedWeight } from './exercises'
import TrainingProgress from './TrainingProgress'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import './polish.css'
import Icon from './Icon'
import WorkoutCalendar from './WorkoutCalendar'
import WorkoutSummary from './WorkoutSummary'
import WorkoutHistory from './WorkoutHistory'
import { exerciseLabel } from './exerciseLabels'
import type { WorkoutRecord } from './workouts'
import BackupDialog from './BackupDialog'
import { fromKg, toKg, locales, readSettings, translator } from './i18n'
import type { Language, MessageKey, Unit } from './i18n'
import ExercisePicker from './ExercisePicker'
import { defaultExercises, exerciseStorageKey, readExercises } from './exercises'
import type { Category, Equipment, Exercise } from './exercises'
import { useRef } from 'react'
import WorkoutPlanner from './WorkoutPlanner'
import type { PlannerHandle } from './WorkoutPlanner'
import type { SetDetail } from './workouts'
import { workoutVolume, validWorkoutMetadata, groupWorkouts, validSetType } from './workouts'
import { pages, readHistoryDate, readPage } from './navigation'
import type { Page } from './navigation'

type Workout = WorkoutRecord
const key = 'workingout.records.v1'
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function load(): { records: Workout[]; error: boolean } {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { records: [], error: false }
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every((r): r is Workout => r && typeof r.id === 'string' && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && typeof r.exercise === 'string' && typeof r.note === 'string' && validWorkoutMetadata(r) && Number.isFinite(r.weight) && r.weight >= 0 && Number.isInteger(r.reps) && r.reps > 0 && Number.isInteger(r.sets) && r.sets > 0 && (r.setDetails === undefined || Array.isArray(r.setDetails) && r.setDetails.length === r.sets && r.setDetails.every((set: SetDetail) => set && validSetType(set.type) && Number.isFinite(set.weight) && set.weight >= 0 && Number.isInteger(set.reps) && set.reps > 0)))) throw new Error()
    return { records: data, error: false }
  } catch { return { records: [], error: true } }
}


function AppContent({ onRestored, restored }: { onRestored: () => void; restored: boolean }) {
  const [backupOpen, setBackupOpen] = useState(false)
  const [page, setPage] = useState(readPage)
  const [hasSession, setHasSession] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [summary, setSummary] = useState<WorkoutRecord[] | null>(null)
  const [filter, setFilter] = useState(readHistoryDate)
  function navigate(next: Page, selectedDate?: string) {
    const hash = '#/' + next + (next === 'history' && selectedDate ? '?date=' + selectedDate : '')
    if (window.location.hash !== hash) window.history.pushState(null, '', hash)
    setPage(readPage())
    setFilter(readHistoryDate())
    window.scrollTo({ top: 0 })
  }
  useEffect(() => {
    const update = () => { setPage(readPage()); setFilter(readHistoryDate()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => { window.removeEventListener('hashchange', update); window.removeEventListener('popstate', update) }
  }, [])
  const [settings, setSettings] = useState(readSettings)
  const { language, unit } = settings
  const t = translator(language)
  const number = (n: number) => n.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  const displayWeight = (kg: number) => number(fromKg(kg, unit))
  useEffect(() => { document.documentElement.lang = language; document.title = 'LIFT LOG | ' + translator(language)('journal') }, [language])
  function changeSettings(next: { language: Language; unit: Unit }) {
    setSettings(next)
    try { localStorage.setItem('workingout.settings.v1', JSON.stringify(next)) }
    catch { setError('saveError') }
  }
  const [initial] = useState(load)
  const [records, setRecords] = useState<Workout[]>(initial.records)
  const [error, setError] = useState<MessageKey | null>(initial.error ? 'loadError' : null)
  const [notice, setNotice] = useState<MessageKey | null>(restored ? 'backupRestored' : null)
  const [date, setDate] = useState(today)
  const [catalogInitial] = useState(readExercises)
  const [customExercises, setCustomExercises] = useState<Exercise[]>(catalogInitial.exercises)
  const [category, setCategory] = useState<Category>('胸')
  const [exercise, setExercise] = useState('ベンチプレス')
  const catalog = [...defaultExercises, ...customExercises].filter((item, index, all) => all.findIndex(e => e.category === item.category && e.name === item.name) === index)
  function addExercise(part: Category, name: string, equipment?: Equipment): MessageKey | null {
    if (!name || name.length > 80) return 'nameError'
    const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase()
    if (catalog.some(e => e.category === part && (normalize(e.name) === normalize(name) || normalize(exerciseLabel(e.name, language)) === normalize(name)))) return 'duplicate'
    const next = [...customExercises, { category: part, name, equipment }]
    try { localStorage.setItem(exerciseStorageKey, JSON.stringify(next)) }
    catch { return 'saveError' }
    setCustomExercises(next); setCategory(part); setExercise(name); setNotice('exerciseAdded')
    return null
  }
  const [weightKg, setWeightKg] = useState<number | null>(20)
  const [reps, setReps] = useState('10')
  const [sets, setSets] = useState('3')
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const planner = useRef<PlannerHandle>(null)
  function save(next: Workout[], message: MessageKey) {
    try { localStorage.setItem(key, JSON.stringify(next)); setRecords(next); setError(null); setNotice(message); return true }
    catch { setError('saveError'); setNotice(null); return false }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!exercise.trim() || !date || weightKg === null || !Number.isFinite(weightKg) || weightKg < 0 || !Number.isInteger(+reps) || +reps < 1 || !Number.isInteger(+sets) || +sets < 1) { setError('invalid'); return }
    const previous = records.find(record => record.id === editing)
    const record: Workout = { id: editing ?? crypto.randomUUID(), date, exercise: exercise.trim(), weight: weightKg, reps: +reps, sets: +sets, note: note.trim(), category, workoutId: previous?.workoutId, workoutName: previous?.workoutName, durationSeconds: previous?.durationSeconds, finishedAt: previous?.finishedAt, feeling: previous?.feeling, workoutNote: previous?.workoutNote }
    if (save(editing ? records.map(r => r.id === editing ? record : r) : [...records, record], editing ? 'updated' : 'added')) { setEditing(null); setNote('') }
  }
  function edit(r: Workout) { setEditing(r.id); setDate(r.date); setExercise(r.exercise); setCategory(r.category ?? catalog.find(e => e.name === r.exercise)?.category ?? 'その他'); setWeightKg(r.weight); setReps(String(r.reps)); setSets(String(r.sets)); setNote(r.note); setNotice(null); document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' }) }
  const visible = records.filter(r => !filter || r.date === filter).sort((a, b) => b.date.localeCompare(a.date))
  const dates = [...new Set(visible.map(r => r.date))]
  const current = records.filter(r => r.date === today())
  return (
    <div className="app">
      {backupOpen && <BackupDialog t={t} language={language} onClose={() => setBackupOpen(false)} onRestored={onRestored} />}
      <header><a className="brand" href="#"><span className="brand-icon"><Icon name="workout" /></span> LIFT LOG</a><button className="secondary backup-trigger" onClick={() => setBackupOpen(true)}>{t('backup')}</button><div className="settings"><label>{t('language')}<select aria-label={t('language')} value={language} onChange={e => changeSettings({ ...settings, language: e.target.value as Language })}><option value="en">English</option><option value="ja">日本語</option><option value="es">Español</option><option value="zh">中文（简体）</option></select></label><label>{t('unit')}<select aria-label={t('unit')} value={unit} onChange={e => changeSettings({ ...settings, unit: e.target.value as Unit })}><option value="kg">kg</option><option value="lb">lb</option></select></label></div></header>
      <nav className="page-nav" aria-label={t('journal')}>{pages.map(item => <a key={item} href={'#/' + item} onClick={event => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(item) } }} aria-current={page === item ? 'page' : undefined}><Icon name={item} /><span>{t(item === 'templates' ? 'templatesNav' : item === 'history' ? 'historyNav' : item === 'calendar' ? 'calendarNav' : item)}</span></a>)}</nav>
      <main>
        {page === 'home' && <div className="home-layout"><div className="home-main">
        <div className="intro"><span className="eyebrow">{t('journal')}</span><h1>{t('title')}</h1><p>{t('subtitle')}</p></div>
        <section className="stats" aria-label={t('summary')}>
          <div><span>{t('days')}</span><strong>{new Set(records.map(r => r.date)).size}<small>{t('dayUnit')}</small></strong></div>
          <div><span>{t('todaySets')}</span><strong>{number(current.reduce((s, r) => s + r.sets, 0))}<small>{t('sets')}</small></strong></div>
          <div><span>{t('volume')}</span><strong>{displayWeight(current.reduce((s, r) => s + workoutVolume(r), 0))}<small>{unit}</small></strong></div>
        </section>
        <div className="home-start panel"><div className="home-art" aria-hidden="true"><div className="art-orbit" /><div className="art-orbit art-orbit-inner" /><Icon name="workout" /><span className="art-dot" /></div><div className="home-start-copy"><span className="eyebrow">LIFT LOG / TODAY</span><h2>{t('noActiveWorkout')}</h2><p>{t('emptyHint')}</p></div><div className="planner-actions">{hasSession ? <button className="primary" onClick={() => navigate('workout')}>{t('continueWorkout')}<Icon name="arrow" /></button> : <button className="primary" onClick={() => planner.current?.empty()}>{t('startEmpty')}<Icon name="arrow" /></button>}<button className="secondary" onClick={() => navigate('templates')}>{t('fromTemplate')}</button><button className="text-button" onClick={() => navigate('history')}>{t('history')}</button></div></div>
        <div className="home-shortcuts"><button className="shortcut-card" onClick={() => navigate('templates')}><span className="shortcut-icon"><Icon name="templates" /></span><span><strong>{t('templates')}</strong><small>{t('templateHint')}</small></span><Icon name="arrow" /></button><button className="shortcut-card" onClick={() => navigate('history')}><span className="shortcut-icon"><Icon name="history" /></span><span><strong>{t('history')}</strong><small>{t('subtitle')}</small></span><Icon name="arrow" /></button></div>
        <button className="secondary home-calendar-link" onClick={() => navigate('calendar')}><Icon name="calendar" />{t('calendar')}<Icon name="arrow" /></button>
        </div><aside className="home-calendar-sidebar"><WorkoutCalendar records={records} language={language} t={t} onSelect={date => navigate('history', date)} /></aside></div>}
        {page === 'progress' && <TrainingProgress records={records} language={language} unit={unit} t={t} />}
        {page === 'calendar' && <div className="calendar-page"><WorkoutCalendar records={records} language={language} t={t} onSelect={date => navigate('history', date)} /></div>}
        {catalogInitial.error && <div role="alert" className="error">{t('catalogError')}</div>}
        {error && <div role="alert" className="error">{t(error)}</div>}
        <p role="status" className="notice">{notice && t(notice)}</p>
        <WorkoutPlanner ref={planner} page={page} navigate={navigate} onActiveChange={setHasSession} onAddExercise={addExercise} language={language} unit={unit} t={t} exercises={catalog} records={records} onFinish={items => { const saved = save([...records, ...items.filter(item => !records.some(record => record.id === item.id))], 'workoutSaved'); if (saved) setSummary(items.map(item => records.find(record => record.id === item.id) ?? item)); return saved }} />
        {page === 'history' && <>{summary && <WorkoutSummary records={summary} language={language} unit={unit} t={t} onClose={() => setSummary(null)} onReflectionChange={reflection => {
          const ids = new Set(summary.map(record => record.id))
          const next = records.map(record => ids.has(record.id) ? { ...record, ...reflection } : record)
          if (save(next, 'updated')) setSummary(next.filter(record => ids.has(record.id)))
        }} />}<div className="history-page-heading"><h1>{t('history')}</h1><button className="secondary" onClick={() => setShowRecordForm(!showRecordForm)}>{t('manualRecord')}</button></div><div className="history-workspace">
          {(showRecordForm || editing) && <section className="panel form-panel" id="record-form">
            <div className="panel-title"><span className="eyebrow">{t('record')}</span><h2>{t(editing ? 'editWorkout' : 'addWorkout')}</h2></div>
            <form onSubmit={submit}>
              <label>{t('date')}<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
              <ExercisePicker category={category} exercise={exercise} exercises={catalog} language={language} t={t} onChange={(part, name) => { setCategory(part); setExercise(name) }} onAdd={addExercise} />
              <div className="number-fields">
                <label>{t('weight')} ({unit})<input type="number" min={isAssisted(exercise) ? undefined : 0} max={isAssisted(exercise) ? 0 : undefined} step="any" inputMode="decimal" required value={weightKg === null ? '' : +fromKg(signedWeight(exercise, weightKg), unit).toFixed(6)} onChange={e => setWeightKg(e.target.value === '' ? null : Math.abs(toKg(+e.target.value, unit)))} /></label>
                <label>{t('reps')}<input type="number" min="1" max="10000" step="1" inputMode="numeric" required value={reps} onChange={e => setReps(e.target.value)} /></label>
                <label>{t('sets')}<input type="number" min="1" max="1000" step="1" inputMode="numeric" required value={sets} onChange={e => setSets(e.target.value)} /></label>
              </div>
              <p className="hint">{t('bodyweight')} ({unit}).</p>
              <label>{t('note')} <span className="optional">{t('optional')}</span><textarea rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder={t('notePlaceholder')} /></label>
              <button className="primary" type="submit">{t(editing ? 'save' : 'addRecord')}</button>
              {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setNote('') }}>{t('cancelEdit')}</button>}
            </form>
          </section>}
          <section className="history">
            <div className="history-heading"><div><span className="eyebrow">{t('historyLabel')}</span><h2>{t('history')}</h2></div><span className="count">{number(groupWorkouts(visible).length)} {t('workoutsCount')}</span></div>
            <details className="history-calendar"><summary>{t('calendar')}</summary><WorkoutCalendar records={records} language={language} t={t} key={filter.slice(0, 7)} selected={filter} onSelect={date => navigate('history', date)} /></details>
            <div className="filter"><label htmlFor="filter-date">{t('filter')}</label><input id="filter-date" type="date" value={filter} onChange={e => navigate('history', e.target.value)} />{filter && <button className="text-button" onClick={() => navigate('history')}>{t('clear')}</button>}</div>
            {visible.length === 0 ? <div className="empty"><div aria-hidden="true">＋</div><h3>{t(filter ? 'noDay' : 'first')}</h3><p>{t(filter ? 'noDayHint' : 'firstHint')}</p></div> : dates.map(day => {
              const rows = visible.filter(r => r.date === day)
              return <section className="day" key={day}><div className="day-heading"><h3>{new Date(`${day}T00:00:00`).toLocaleDateString(locales[language], { month: 'long', day: 'numeric', weekday: 'short', year: 'numeric' })}{day === today() && <span className="today">{t('today')}</span>}</h3><div className="day-actions"><span>{rows.reduce((s, r) => s + r.sets, 0)} {t('sets')}</span><button className="text-button" onClick={() => planner.current?.repeat(rows)}>{t('repeatDay')}</button></div></div>
                <WorkoutHistory allRecords={records} onDeleteWorkout={items => {
                  const ids = new Set(items.map(item => item.id))
                  if (save(records.filter(item => !ids.has(item.id)), 'deleted')) {
                    setDeleting(null)
                    if (editing && ids.has(editing)) { setEditing(null); setNote('') }
                    if (summary?.some(item => ids.has(item.id))) setSummary(null)
                  }
                }} records={rows} language={language} unit={unit} t={t} exercises={catalog} onTemplate={items => planner.current?.template(items)} onRepeat={items => planner.current?.repeat(items)} onEdit={edit} deleting={deleting} setDeleting={setDeleting} onDelete={record => { if (save(records.filter(item => item.id !== record.id), 'deleted')) { setDeleting(null); if (editing === record.id) { setEditing(null); setNote('') } if (summary?.some(item => item.id === record.id)) setSummary(null) }}} onSummary={items => { setSummary(items); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              </section>
            })}
          </section>
        </div></>}
        <footer>{t('local')}<span>{t('formula')}</span></footer>
      </main>
    </div>
  )
}
function App() {
  const [revision, setRevision] = useState(0)
  return <AppContent key={revision} restored={revision > 0} onRestored={() => setRevision(value => value + 1)} />
}
export default App

