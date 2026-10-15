import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { fromKg, toKg, locales, readSettings, translator } from './i18n'
import type { Language, MessageKey, Unit } from './i18n'
import { categoryLabel, exerciseLabel } from './exerciseLabels'
import ExercisePicker from './ExercisePicker'
import { defaultExercises, exerciseStorageKey, readExercises } from './exercises'
import type { Category, Exercise } from './exercises'

type Workout = { id: string; date: string; exercise: string; weight: number; reps: number; sets: number; note: string; category?: Category }
const key = 'workingout.records.v1'
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function load(): { records: Workout[]; error: boolean } {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { records: [], error: false }
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every((r): r is Workout => r && typeof r.id === 'string' && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && typeof r.exercise === 'string' && typeof r.note === 'string' && Number.isFinite(r.weight) && r.weight >= 0 && Number.isInteger(r.reps) && r.reps > 0 && Number.isInteger(r.sets) && r.sets > 0)) throw new Error()
    return { records: data, error: false }
  } catch { return { records: [], error: true } }
}


function App() {
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
  const [notice, setNotice] = useState<MessageKey | null>(null)
  const [date, setDate] = useState(today)
  const [catalogInitial] = useState(readExercises)
  const [customExercises, setCustomExercises] = useState<Exercise[]>(catalogInitial.exercises)
  const [category, setCategory] = useState<Category>('胸')
  const [exercise, setExercise] = useState('ベンチプレス')
  const catalog = [...defaultExercises, ...customExercises].filter((item, index, all) => all.findIndex(e => e.category === item.category && e.name === item.name) === index)
  function addExercise(part: Category, name: string): MessageKey | null {
    if (!name || name.length > 80) return 'nameError'
    const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase()
    if (catalog.some(e => e.category === part && (normalize(e.name) === normalize(name) || normalize(exerciseLabel(e.name, language)) === normalize(name)))) return 'duplicate'
    const next = [...customExercises, { category: part, name }]
    try { localStorage.setItem(exerciseStorageKey, JSON.stringify(next)) }
    catch { return 'saveError' }
    setCustomExercises(next); setCategory(part); setExercise(name); setNotice('exerciseAdded')
    return null
  }
  const [weightKg, setWeightKg] = useState<number | null>(20)
  const [reps, setReps] = useState('10')
  const [sets, setSets] = useState('3')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  function save(next: Workout[], message: MessageKey) {
    try { localStorage.setItem(key, JSON.stringify(next)); setRecords(next); setError(null); setNotice(message); return true }
    catch { setError('saveError'); setNotice(null); return false }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!exercise.trim() || !date || weightKg === null || !Number.isFinite(weightKg) || weightKg < 0 || !Number.isInteger(+reps) || +reps < 1 || !Number.isInteger(+sets) || +sets < 1) { setError('invalid'); return }
    const record: Workout = { id: editing ?? crypto.randomUUID(), date, exercise: exercise.trim(), weight: weightKg, reps: +reps, sets: +sets, note: note.trim(), category }
    if (save(editing ? records.map(r => r.id === editing ? record : r) : [...records, record], editing ? 'updated' : 'added')) { setEditing(null); setNote('') }
  }
  function edit(r: Workout) { setEditing(r.id); setDate(r.date); setExercise(r.exercise); setCategory(r.category ?? catalog.find(e => e.name === r.exercise)?.category ?? 'その他'); setWeightKg(r.weight); setReps(String(r.reps)); setSets(String(r.sets)); setNote(r.note); setNotice(null); document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' }) }
  const visible = records.filter(r => !filter || r.date === filter).sort((a, b) => b.date.localeCompare(a.date))
  const dates = [...new Set(visible.map(r => r.date))]
  const current = records.filter(r => r.date === today())
  return (
    <div className="app">
      <header><a className="brand" href="#"><span className="brand-icon" aria-hidden="true">▥</span> LIFT LOG</a><div className="settings"><label>{t('language')}<select value={language} onChange={e => changeSettings({ ...settings, language: e.target.value as Language })}><option value="en">English</option><option value="ja">日本語</option><option value="es">Español</option><option value="zh">中文（简体）</option></select></label><label>{t('unit')}<select value={unit} onChange={e => changeSettings({ ...settings, unit: e.target.value as Unit })}><option value="kg">kg</option><option value="lb">lb</option></select></label></div></header>
      <main>
        <div className="intro"><span className="eyebrow">{t('journal')}</span><h1>{t('title')}</h1><p>{t('subtitle')}</p></div>
        <section className="stats" aria-label={t('summary')}>
          <div><span>{t('days')}</span><strong>{new Set(records.map(r => r.date)).size}<small>{t('dayUnit')}</small></strong></div>
          <div><span>{t('todaySets')}</span><strong>{number(current.reduce((s, r) => s + r.sets, 0))}<small>{t('sets')}</small></strong></div>
          <div><span>{t('volume')}</span><strong>{displayWeight(current.reduce((s, r) => s + r.weight * r.reps * r.sets, 0))}<small>{unit}</small></strong></div>
        </section>
        {catalogInitial.error && <div role="alert" className="error">{t('catalogError')}</div>}
        {error && <div role="alert" className="error">{t(error)}</div>}
        <p role="status" className="notice">{notice && t(notice)}</p>
        <div className="workspace">
          <section className="panel form-panel" id="record-form">
            <div className="panel-title"><span className="eyebrow">{t('record')}</span><h2>{t(editing ? 'editWorkout' : 'addWorkout')}</h2></div>
            <form onSubmit={submit}>
              <label>{t('date')}<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
              <ExercisePicker category={category} exercise={exercise} exercises={catalog} language={language} t={t} onChange={(part, name) => { setCategory(part); setExercise(name) }} onAdd={addExercise} />
              <div className="number-fields">
                <label>{t('weight')} ({unit})<input type="number" min="0" step="any" required value={weightKg === null ? '' : +fromKg(weightKg, unit).toFixed(6)} onChange={e => setWeightKg(e.target.value === '' ? null : toKg(+e.target.value, unit))} /></label>
                <label>{t('reps')}<input type="number" min="1" max="10000" step="1" required value={reps} onChange={e => setReps(e.target.value)} /></label>
                <label>{t('sets')}<input type="number" min="1" max="1000" step="1" required value={sets} onChange={e => setSets(e.target.value)} /></label>
              </div>
              <p className="hint">{t('bodyweight')} ({unit}).</p>
              <label>{t('note')} <span className="optional">{t('optional')}</span><textarea rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder={t('notePlaceholder')} /></label>
              <button className="primary" type="submit">{t(editing ? 'save' : 'addRecord')}</button>
              {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setNote('') }}>{t('cancelEdit')}</button>}
            </form>
          </section>
          <section className="history">
            <div className="history-heading"><div><span className="eyebrow">{t('historyLabel')}</span><h2>{t('history')}</h2></div><span className="count">{number(visible.length)} {t('records')}</span></div>
            <div className="filter"><label htmlFor="filter-date">{t('filter')}</label><input id="filter-date" type="date" value={filter} onChange={e => setFilter(e.target.value)} />{filter && <button className="text-button" onClick={() => setFilter('')}>{t('clear')}</button>}</div>
            {visible.length === 0 ? <div className="empty"><div aria-hidden="true">＋</div><h3>{t(filter ? 'noDay' : 'first')}</h3><p>{t(filter ? 'noDayHint' : 'firstHint')}</p></div> : dates.map(day => {
              const rows = visible.filter(r => r.date === day)
              return <section className="day" key={day}><div className="day-heading"><h3>{new Date(`${day}T00:00:00`).toLocaleDateString(locales[language], { month: 'long', day: 'numeric', weekday: 'short', year: 'numeric' })}{day === today() && <span className="today">{t('today')}</span>}</h3><span>{rows.reduce((s, r) => s + r.sets, 0)} {t('sets')}</span></div>
                {rows.map(r => <article className="record" key={r.id}><div className="record-main"><div><h4>{exerciseLabel(r.exercise, language)}<span className="exercise-category">{categoryLabel(r.category ?? catalog.find(e => e.name === r.exercise)?.category ?? 'その他', language)}</span></h4><p className="metrics"><strong>{displayWeight(r.weight)}</strong> {unit} <span>×</span> <strong>{r.reps}</strong> {t('reps')} <span>×</span> <strong>{r.sets}</strong> {t('sets')}</p></div><div className="actions"><button onClick={() => edit(r)} aria-label={`${t('edit')}: ${exerciseLabel(r.exercise, language)}`}>{t('edit')}</button><button onClick={() => setDeleting(r.id)} aria-label={`${t('delete')}: ${exerciseLabel(r.exercise, language)}`}>{t('delete')}</button></div></div>{r.note && <p className="record-note">{r.note}</p>}{deleting === r.id && <div className="delete-confirm"><span>{t('confirmDelete')}</span><button className="danger" onClick={() => { if (save(records.filter(item => item.id !== r.id), 'deleted')) { setDeleting(null); if (editing === r.id) { setEditing(null); setNote('') } } }}>{t('delete')}</button><button onClick={() => setDeleting(null)}>{t('cancel')}</button></div>}</article>)}
              </section>
            })}
          </section>
        </div>
        <footer>{t('local')}<span>{t('formula')}</span></footer>
      </main>
    </div>
  )
}
export default App

