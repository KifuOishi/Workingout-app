import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Exercise } from './exercises'
import { categories } from './exercises'
import { categoryLabel, exerciseLabel } from './exerciseLabels'
import { fromKg, locales, toKg } from './i18n'
import type { Language, MessageKey, Translate, Unit } from './i18n'
import { completedRecords, plannerKey, readPlanner, remainingTime, startSession, validTemplate } from './workouts'
import type { PlanItem, PlannerState, SessionSet, Template } from './workouts'
import ExercisePicker from './ExercisePicker'
import type { Category } from './exercises'
import type { Page } from './navigation'
import { disablePush, enablePush, PushError, pushEnabled, syncRestPush } from './push'

export type PlannerHandle = { repeat: (items: PlanItem[]) => void; empty: () => void }
type Props = { page: Page; navigate: (page: Page) => void; onActiveChange: (active: boolean) => void; onAddExercise: (category: Category, name: string) => MessageKey | null; language: Language; unit: Unit; t: Translate; exercises: Exercise[]; records: (PlanItem & { date: string })[]; onFinish: (records: ReturnType<typeof completedRecords>) => boolean }

const WorkoutPlanner = forwardRef<PlannerHandle, Props>(function WorkoutPlanner({ page, navigate, onActiveChange, onAddExercise, language, unit, t, exercises, records, onFinish }, ref) {
  const [initial] = useState(readPlanner)
  const [state, setState] = useState(initial.state)
  const [error, setError] = useState<MessageKey | null>(initial.error ? 'plannerError' : null)
  const [notice, setNotice] = useState<MessageKey | null>(null)
  const [editor, setEditor] = useState<Template | null>(null)
  const [pending, setPending] = useState<Template | null>(null)
  const [discarding, setDiscarding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addingExercise, setAddingExercise] = useState(false)
  const [addCategory, setAddCategory] = useState<Category>('胸')
  const [addExercise, setAddExercise] = useState('ベンチプレス')
  const [now, setNow] = useState(Date.now)
  const [alerts, setAlerts] = useState<'idle' | 'enabled' | 'unavailable'>(() => pushEnabled() ? 'enabled' : 'idle')
  const [pushProblem, setPushProblem] = useState<MessageKey | null>(null)
  const [pushDelivery, setPushDelivery] = useState<'pushPending' | 'pushScheduled' | null>(null)
  const [pushEpoch, setPushEpoch] = useState(0)
  const audio = useRef<AudioContext | null>(null)
  const notified = useRef<number | null>(null)
  const session = state.session
  const sessionId = session?.id
  useEffect(() => { onActiveChange(!!sessionId) }, [sessionId, onActiveChange])
  const timer = session?.timer
  const restBody = t('restDone')
  useEffect(() => {
    if (alerts !== 'enabled' || timer?.ringing || timer?.endAt && timer.endAt <= Date.now()) return
    let current = true
    void Promise.resolve().then(() => { if (current) setPushDelivery(timer?.endAt ? 'pushPending' : null) })
    void syncRestPush(timer?.endAt ?? null, restBody).then(() => { if (current) { setPushProblem(null); setPushDelivery(timer?.endAt ? 'pushScheduled' : null) } }).catch(error => { if (current) { setPushDelivery(null); setPushProblem(error instanceof PushError ? error.code : 'pushFailed') } })
    return () => { current = false }
  }, [alerts, timer?.endAt, timer?.ringing, restBody, pushEpoch])
  const num = (n: number) => n.toLocaleString(locales[language], { maximumFractionDigits: 2 })
  const commit = useCallback((next: PlannerState) => {
    try { localStorage.setItem(plannerKey, JSON.stringify(next)); setState(next); setError(null); return true }
    catch { setError('saveError'); return false }
  }, [])
  function armSound() {
    try { audio.current ??= new AudioContext(); void audio.current.resume().catch(() => {}) } catch { /* Visual alert works without audio support. */ }
  }
  useEffect(() => () => { void audio.current?.close().catch(() => {}) }, [])
  useEffect(() => {
    if (!sessionId) return
    document.getElementById('current-workout')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [sessionId])
  useEffect(() => {
    if (!session || !timer?.endAt || timer.endAt > now || notified.current === timer.endAt) return
    notified.current = timer.endAt
    commit({ ...state, session: { ...session, timer: { endAt: null, remainingMs: 0, ringing: true } } })
    try {
      const ctx = audio.current
      if (ctx?.state === 'running' && (alerts !== 'enabled' || pushProblem)) {
        for (let i = 0; i < 3; i++) {
          const oscillator = ctx.createOscillator(); const gain = ctx.createGain()
          oscillator.connect(gain); gain.connect(ctx.destination); oscillator.frequency.value = 880
          const at = ctx.currentTime + i * 0.4
          gain.gain.setValueAtTime(0.15, at); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25)
          oscillator.start(at); oscillator.stop(at + 0.3)
        }
      }
      if (alerts !== 'enabled' && 'Notification' in window && Notification.permission === 'granted') new Notification('LIFT LOG', { body: t('restDone'), tag: 'lift-log-rest' })
    } catch { /* On-page alert remains available. */ }
  }, [now, timer, session, state, t, commit, alerts, pushProblem])
  function start(plan: Template) {
    armSound()
    navigate('workout')
    if (state.session) { setPending(plan); document.getElementById('workout-planner')?.scrollIntoView({ behavior: 'smooth' }); return }
    if (commit({ ...state, session: startSession(plan) })) { setNotice(null); setDiscarding(false); document.getElementById('current-workout')?.scrollIntoView({ behavior: 'smooth' }) }
  }
  function startEmpty() { start({ id: crypto.randomUUID(), name: '__empty__', items: [], restSeconds: 120 }) }
  useImperativeHandle(ref, () => ({ repeat(items) { start({ id: crypto.randomUUID(), name: '__repeat__', items, restSeconds: 120 }) }, empty: startEmpty }))
  function addToSession(e: FormEvent) {
    e.preventDefault()
    if (!session || !addExercise || !exercises.some(item => item.name === addExercise && item.category === addCategory)) return
    const item: PlanItem = { id: crypto.randomUUID(), exercise: addExercise, category: addCategory, weight: 20, reps: 10, sets: 1, note: '' }
    const row: SessionSet = { id: crypto.randomUUID(), weight: 20, reps: 10, done: false, restSeconds: session.restSeconds }
    if (commit({ ...state, session: { ...session, items: [...session.items, item], setRows: { ...session.setRows, [item.id]: [row] } } })) setAddingExercise(false)
  }
  function addItem() {
    if (!editor) return
    const first = exercises[0]
    if (first) setEditor({ ...editor, items: [...editor.items, { id: crypto.randomUUID(), exercise: first.name, category: first.category, weight: 20, reps: 10, sets: 3, note: '' }] })
  }
  function updateItem(id: string, patch: Partial<PlanItem>) {
    if (editor) setEditor({ ...editor, items: editor.items.map(item => item.id === id ? { ...item, ...patch } : item) })
  }
  function saveTemplate(e: FormEvent) {
    e.preventDefault()
    if (!editor || !validTemplate(editor)) { setError('templateError'); return }
    const next = { ...editor, name: editor.name.trim() }
    if (commit({ ...state, templates: state.templates.some(p => p.id === next.id) ? state.templates.map(p => p.id === next.id ? next : p) : [...state.templates, next] })) { setEditor(null); setNotice('templateSaved') }
  }
  function updateSet(itemId: string, setId: string, patch: Partial<SessionSet>) {
    if (!session) return
    commit({ ...state, session: { ...session, setRows: { ...session.setRows, [itemId]: session.setRows[itemId].map(row => row.id === setId ? { ...row, ...patch } : row) } } })
  }
  function toggleSet(itemId: string, setId: string, timestamp: number) {
    if (!session) return
    armSound()
    const row = session.setRows[itemId].find(row => row.id === setId)
    if (!row || row.weight === null || row.reps === null) return
    const setRows = { ...session.setRows, [itemId]: session.setRows[itemId].map(set => set.id === setId ? { ...set, done: !set.done } : set) }
    const completed = session.items.filter(item => setRows[item.id].every(set => set.done)).map(item => item.id)
    const autoRest = !row.done && row.restSeconds > 0
    const endAt = timestamp + row.restSeconds * 1000
    if (autoRest) { notified.current = null; setNow(timestamp) }
    commit({ ...state, session: { ...session, setRows, completed, timer: autoRest ? { endAt, remainingMs: row.restSeconds * 1000, ringing: false } : session.timer } })
  }
  function startRest() {
    if (!session || session.restSeconds === 0) return
    armSound(); notified.current = null; setNow(Date.now())
    commit({ ...state, session: { ...session, timer: { endAt: Date.now() + session.restSeconds * 1000, remainingMs: session.restSeconds * 1000, ringing: false } } })
  }
  async function enableAlerts() {
    armSound()
    try { await enablePush(); setAlerts('enabled'); setPushProblem(null); setPushEpoch(value => value + 1) }
    catch (error) { setAlerts('unavailable'); setPushProblem(error instanceof PushError ? error.code : 'pushFailed') }
  }
  async function disableAlerts() {
    try { await disablePush(); setAlerts('idle'); setPushProblem(null) }
    catch (error) { setPushProblem(error instanceof PushError ? error.code : 'pushFailed') }
  }
  function finish() {
    if (!session || session.items.length === 0 || !Object.values(session.setRows).every(rows => rows.every(row => row.done))) return
    // Stable record IDs make retry safe if saving history succeeds but clearing progress fails.
    if (onFinish(completedRecords(session)) && commit({ ...state, session: null })) { setNotice('workoutSaved'); setDiscarding(false); setAddingExercise(false); navigate('history') }
  }
  const secondsLeft = timer ? Math.ceil(remainingTime(timer, now) / 1000) : 0
  const allSets = session ? Object.values(session.setRows).flat() : []
  const doneSets = allSets.filter(row => row.done).length
  const elapsed = session ? Math.max(0, Math.floor((now - session.startedAt) / 1000)) : 0
  return <section id="workout-planner" className="planner" hidden={page !== 'workout' && page !== 'templates'}>
    {pending && <div className="planner-confirm" role="alert"><p>{t('replaceConfirm')}</p><button className="primary" onClick={() => { if (commit({ ...state, session: startSession(pending) })) { setPending(null); setDiscarding(false); setNow(Date.now()) } }}>{t('replaceWorkout')}</button><button className="secondary" onClick={() => setPending(null)}>{t('cancel')}</button></div>}
    {page === 'workout' && !session && <div className="workout-welcome panel"><span className="eyebrow">LIFT LOG / TRAIN</span><h1>{t('noActiveWorkout')}</h1><p>{t('emptyHint')}</p><div className="planner-actions"><button className="primary" onClick={startEmpty}>{t('startEmpty')}</button><button className="secondary" onClick={() => navigate('templates')}>{t('fromTemplate')}</button></div></div>}
    {page === 'templates' && <>
    <div className="planner-heading"><div><span className="eyebrow">LIFT LOG / PLAN</span><h2>{t('templates')}</h2><p>{t('templateHint')}</p></div><button className="primary" onClick={() => { setEditor({ id: crypto.randomUUID(), name: '', restSeconds: 120, items: [] }); setNotice(null) }}>{t('createTemplate')}</button></div>
    {error && <p role="alert" className="error">{t(error)}</p>}
    {notice && <p role="status" className="notice">{t(notice)}</p>}

    {editor && <form className="template-editor panel" onSubmit={saveTemplate}>
      <div className="editor-fields"><label>{t('templateName')}<input required maxLength={80} value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })} placeholder={t('templatePlaceholder')} /></label><label>{t('restInterval')} ({t('seconds')})<input type="number" required min="0" max="3600" step="1" inputMode="numeric" value={Number.isNaN(editor.restSeconds) ? '' : editor.restSeconds} onChange={e => setEditor({ ...editor, restSeconds: e.target.value === '' ? NaN : +e.target.value })} /></label></div>
      <p className="hint">{t('setRestHelp')}</p>
      {editor.items.map((item, index) => <div className="template-item" key={item.id}><div className="template-item-top"><label>{index + 1}. {t('exercise')}<select value={JSON.stringify([item.category, item.exercise])} onChange={e => { const [category, exercise] = JSON.parse(e.target.value); updateItem(item.id, { category, exercise }) }}>{!exercises.some(e => e.name === item.exercise && e.category === item.category) && <option value={JSON.stringify([item.category, item.exercise])}>{exerciseLabel(item.exercise, language)}</option>}{categories.map(c => <optgroup key={c} label={categoryLabel(c, language)}>{exercises.filter(e => e.category === c).map(e => <option key={e.name} value={JSON.stringify([c, e.name])}>{exerciseLabel(e.name, language)}</option>)}</optgroup>)}</select></label><button type="button" className="text-button" aria-label={`${t('delete')}: ${exerciseLabel(item.exercise, language)}`} onClick={() => setEditor({ ...editor, items: editor.items.filter(i => i.id !== item.id) })}>{t('delete')}</button></div>
        <div className="number-fields"><label>{t('weight')} ({unit})<input type="number" required min="0" step="any" inputMode="decimal" value={Number.isNaN(item.weight) ? '' : +fromKg(item.weight, unit).toFixed(6)} onChange={e => updateItem(item.id, { weight: e.target.value === '' ? NaN : toKg(+e.target.value, unit) })} /></label><label>{t('reps')}<input type="number" required min="1" max="10000" step="1" inputMode="numeric" value={Number.isNaN(item.reps) ? '' : item.reps} onChange={e => updateItem(item.id, { reps: e.target.value === '' ? NaN : +e.target.value })} /></label><label>{t('sets')}<input type="number" required min="1" max="1000" step="1" inputMode="numeric" value={Number.isNaN(item.sets) ? '' : item.sets} onChange={e => updateItem(item.id, { sets: e.target.value === '' ? NaN : +e.target.value })} /></label></div>
      </div>)}
      <div className="planner-actions"><button type="button" className="secondary" onClick={addItem}>{t('addPlanItem')}</button><button className="primary" type="submit">{t('saveTemplate')}</button><button type="button" className="text-button" onClick={() => setEditor(null)}>{t('cancel')}</button></div>
    </form>}
    <div className="template-grid">{state.templates.length === 0 ? <p className="planner-empty">{t('noTemplates')}</p> : state.templates.map(plan => <article key={plan.id} className="template-card"><h3>{plan.name}</h3><ol>{plan.items.map(item => <li key={item.id}>{exerciseLabel(item.exercise, language)} <small>{num(fromKg(item.weight, unit))} {unit} · {item.reps} × {item.sets}</small></li>)}</ol><p className="hint">{t('restInterval')}: {plan.restSeconds} {t('seconds')}</p><div className="planner-actions"><button className="primary" onClick={() => start(plan)}>{t('startWorkout')}</button><button className="text-button" onClick={() => setEditor({ ...plan, items: plan.items.map(i => ({ ...i })) })}>{t('edit')}</button><button className="text-button" onClick={() => setDeleteId(plan.id)}>{t('delete')}</button></div>{deleteId === plan.id && <div className="planner-confirm"><p>{t('deleteTemplate')}</p><button className="secondary" onClick={() => { if (commit({ ...state, templates: state.templates.filter(p => p.id !== plan.id) })) setDeleteId(null) }}>{t('delete')}</button><button className="text-button" onClick={() => setDeleteId(null)}>{t('cancel')}</button></div>}</article>)}</div>
    </>}
    {page === 'workout' && error && <p role="alert" className="error">{t(error)}</p>}
    {page === 'workout' && session && <section id="current-workout" className="current-workout panel live-workout">
      <div className="live-toolbar"><div><span className="eyebrow">{t('activeWorkout')} · {session.date}</span><h2>{session.name === '__repeat__' ? t('repeatWorkout') : session.name === '__empty__' ? t('emptyWorkout') : session.name}</h2></div><div className="live-toolbar-end"><span className="live-rest-count">{t('restInterval')} {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</span><span aria-label={t('elapsed')} className="elapsed">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span><button className="primary" disabled={allSets.length === 0 || doneSets !== allSets.length} onClick={finish}>{t('finishWorkout')}</button></div></div>
      <div className="live-progress"><span>{doneSets} / {allSets.length} {t('sets')} · {t('completed')}</span><progress value={doneSets} max={allSets.length || 1} /><span className="progress-rest">{t('restInterval')} <strong>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</strong></span></div>
      <div className="session-exercise-actions"><button className="secondary" onClick={() => setAddingExercise(!addingExercise)}>{t('addPlanItem')}</button></div>
      {addingExercise && <form className="session-add-form panel" onSubmit={addToSession}><h3>{t('addPlanItem')}</h3><ExercisePicker category={addCategory} exercise={addExercise} exercises={exercises} language={language} t={t} onChange={(category, name) => { setAddCategory(category); setAddExercise(name) }} onAdd={(category, name) => { const result = onAddExercise(category, name); if (!result) { setAddCategory(category); setAddExercise(name) } return result }} /><div className="planner-actions"><button type="submit" className="primary">{t('sessionAdd')}</button><button type="button" className="text-button" onClick={() => setAddingExercise(false)}>{t('cancel')}</button></div></form>}
      {session.items.length === 0 && <div className="empty session-empty"><h3>{t('addFirstExercise')}</h3><p>{t('emptyHint')}</p></div>}
      <div className="session-layout"><div className="set-exercises">{session.items.map(item => {
        const previous = [...records].reverse().filter(record => record.exercise === item.exercise).sort((a, b) => b.date.localeCompare(a.date))[0]
        const rows = session.setRows[item.id]
        return <section className="live-exercise" key={item.id}><div className="exercise-heading"><h3>{exerciseLabel(item.exercise, language)}</h3><span className="count">{rows.filter(row => row.done).length} / {rows.length}</span></div>
          {rows.map((row, index) => {
            const prev = previous?.setDetails ? previous.setDetails[index] : previous && index < previous.sets ? previous : undefined
            return <div className={row.done ? 'set-entry set-complete' : 'set-entry'} key={row.id}>
              <div className="set-card-heading"><div className="set-card-title"><span className="set-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{t('set')} {index + 1}</strong><p className="previous-summary">{t('previous')}: <span className="previous-set">{prev ? num(fromKg(prev.weight, unit)) + ' ' + unit + ' × ' + prev.reps : '—'}</span></p></div></div>
                <label className="set-check"><input type="checkbox" aria-label={exerciseLabel(item.exercise, language) + ' ' + t('set') + ' ' + (index + 1)} checked={row.done} disabled={row.weight === null || row.reps === null} onChange={() => toggleSet(item.id, row.id, Date.now())} /><span aria-hidden="true">✓</span></label>
              </div>
              <div className="set-card-fields">
                <label>{t('weight')} <span className="field-unit">{unit}</span><input aria-label={t('weight') + ' ' + (index + 1) + ' (' + unit + ')'} type="number" min="0" step="any" inputMode="decimal" disabled={row.done} value={row.weight === null ? '' : +fromKg(row.weight, unit).toFixed(6)} onChange={e => updateSet(item.id, row.id, { weight: e.target.value === '' ? null : Math.max(0, toKg(+e.target.value, unit)) })} /></label>
                <label>{t('reps')}<input aria-label={t('reps') + ' ' + (index + 1)} type="number" min="1" step="1" inputMode="numeric" disabled={row.done} value={row.reps ?? ''} onChange={e => updateSet(item.id, row.id, { reps: e.target.value === '' ? null : Math.max(1, Math.floor(+e.target.value)) })} /></label>
              </div>
              <div className="set-card-footer"><label className="set-rest">{t('restInterval')}<input type="number" min="0" max="3600" step="1" inputMode="numeric" aria-label={t('restInterval') + ' ' + (index + 1)} value={row.restSeconds} onChange={e => { const value = +e.target.value; if (e.target.value !== '' && Number.isInteger(value) && value >= 0 && value <= 3600) updateSet(item.id, row.id, { restSeconds: value }) }} /><small>{t('seconds')}</small></label>
                <button type="button" className="remove-set" aria-label={t('removeSet') + ' ' + (index + 1)} disabled={row.done || rows.length <= 1} onClick={() => commit({ ...state, session: { ...session, completed: session.completed.filter(id => id !== item.id), setRows: { ...session.setRows, [item.id]: rows.filter(set => set.id !== row.id) } } })}>×</button>
              </div>
            </div>
          })}
          <button className="add-set" onClick={() => { const last = rows[rows.length - 1]; commit({ ...state, session: { ...session, completed: session.completed.filter(id => id !== item.id), setRows: { ...session.setRows, [item.id]: [...rows, { ...last, id: crypto.randomUUID(), done: false, restSeconds: session.restSeconds }] } } }) }}>{t('addSet')}</button>
          {item.note && <p className="hint">{item.note}</p>}
        </section>
      })}</div>
        <div className={`rest-timer ${timer?.ringing ? 'timer-finished' : ''}`}><label>{t('restInterval')} ({t('seconds')})<input type="number" min="0" max="3600" step="1" inputMode="numeric" value={session.restSeconds} onChange={e => { const value = +e.target.value; if (e.target.value !== '' && Number.isInteger(value) && value >= 0 && value <= 3600) commit({ ...state, session: { ...session, restSeconds: value } }) }} /></label><output className="timer-digits" aria-label={t('restInterval')}>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</output>{timer?.ringing && <p role="alert" className="rest-alert">{t('restDone')}</p>}<div className="planner-actions"><button className="primary" disabled={session.restSeconds === 0} onClick={startRest}>{t('startRest')}</button>{timer && (timer.endAt !== null || timer.remainingMs > 0) && <button className="secondary" onClick={() => { armSound(); setNow(Date.now()); notified.current = null; commit({ ...state, session: { ...session, timer: timer.endAt !== null ? { endAt: null, remainingMs: remainingTime(timer, Date.now()), ringing: false } : { endAt: Date.now() + timer.remainingMs, remainingMs: timer.remainingMs, ringing: false } } }) }}>{t(timer.endAt !== null ? 'pause' : 'resume')}</button>}<button className="text-button" onClick={() => commit({ ...state, session: { ...session, timer: { endAt: null, remainingMs: 0, ringing: false } } })}>{t('resetTimer')}</button></div><button className="text-button" onClick={() => void enableAlerts()}>{t(alerts === 'enabled' ? 'alertsEnabled' : 'enableAlerts')}</button>{alerts === 'enabled' && <button className="text-button" onClick={() => void disableAlerts()}>{t('disableAlerts')}</button>}{timer?.endAt && pushDelivery && <p className="push-status" role="status">{t(pushDelivery)}</p>}{pushProblem && <p className="push-status" role="status">{t(pushProblem)}</p>}<p className="hint">{t('pushHelp')}</p>{alerts === 'unavailable' && <p className="hint" role="status">{t('alertsUnavailable')}</p>}{alerts !== 'enabled' && <p className="hint">{t('timerHint')}</p>}</div></div>
      <p className="hint">{t('setRestHelp')}</p><p className="hint">{t('finishSetsHint')}</p><div className="planner-actions"><button className="text-button" onClick={() => setDiscarding(true)}>{t('discardWorkout')}</button></div>{discarding && <div className="planner-confirm"><p>{t('discardConfirm')}</p><button className="secondary" onClick={() => { if (commit({ ...state, session: null })) setDiscarding(false) }}>{t('discardWorkout')}</button><button className="text-button" onClick={() => setDiscarding(false)}>{t('cancel')}</button></div>}
    </section>}
  </section>
})
export default WorkoutPlanner
