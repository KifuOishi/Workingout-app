import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import ExercisePicker from './ExercisePicker'
import { defaultExercises, exerciseStorageKey, readExercises } from './exercises'
import type { Category, Exercise } from './exercises'

type Workout = { id: string; date: string; exercise: string; weight: number; reps: number; sets: number; note: string; category?: Category }
const key = 'workingout.records.v1'
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function load(): { records: Workout[]; error: string } {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { records: [], error: '' }
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every((r): r is Workout => r && typeof r.id === 'string' && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && typeof r.exercise === 'string' && typeof r.note === 'string' && Number.isFinite(r.weight) && r.weight >= 0 && Number.isInteger(r.reps) && r.reps > 0 && Number.isInteger(r.sets) && r.sets > 0)) throw new Error()
    return { records: data, error: '' }
  } catch { return { records: [], error: '保存済みの記録を読み込めませんでした。ブラウザの保存設定を確認してください。' } }
}
const number = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 2 })

function App() {
  const [initial] = useState(load)
  const [records, setRecords] = useState<Workout[]>(initial.records)
  const [error, setError] = useState(initial.error)
  const [notice, setNotice] = useState('')
  const [date, setDate] = useState(today)
  const [catalogInitial] = useState(readExercises)
  const [customExercises, setCustomExercises] = useState<Exercise[]>(catalogInitial.exercises)
  const [category, setCategory] = useState<Category>('胸')
  const [exercise, setExercise] = useState('ベンチプレス')
  const catalog = [...defaultExercises, ...customExercises].filter((item, index, all) => all.findIndex(e => e.category === item.category && e.name === item.name) === index)
  function addExercise(part: Category, name: string): string | null {
    if (!name || name.length > 80) return '種目名を1〜80文字で入力してください。'
    if (catalog.some(e => e.category === part && e.name.normalize('NFKC').toLocaleLowerCase() === name.normalize('NFKC').toLocaleLowerCase())) return 'この部位には同じ名前の種目が登録されています。'
    const next = [...customExercises, { category: part, name }]
    try { localStorage.setItem(exerciseStorageKey, JSON.stringify(next)) }
    catch { return '種目を保存できませんでした。ブラウザの保存設定や空き容量を確認してください。' }
    setCustomExercises(next); setCategory(part); setExercise(name); setNotice(`「${part}」に「${name}」を追加しました。`)
    return null
  }
  const [weight, setWeight] = useState('20')
  const [reps, setReps] = useState('10')
  const [sets, setSets] = useState('3')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  function save(next: Workout[], message: string) {
    try { localStorage.setItem(key, JSON.stringify(next)); setRecords(next); setError(''); setNotice(message); return true }
    catch { setError('記録を保存できませんでした。ブラウザの空き容量や保存設定を確認して、もう一度お試しください。'); setNotice(''); return false }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!exercise.trim() || !date || !Number.isFinite(+weight) || +weight < 0 || !Number.isInteger(+reps) || +reps < 1 || !Number.isInteger(+sets) || +sets < 1) { setError('種目と日付、正しい重量・回数・セット数を入力してください。'); return }
    const record: Workout = { id: editing ?? crypto.randomUUID(), date, exercise: exercise.trim(), weight: +weight, reps: +reps, sets: +sets, note: note.trim(), category }
    if (save(editing ? records.map(r => r.id === editing ? record : r) : [...records, record], editing ? '記録を更新しました。' : 'トレーニングを記録しました。')) { setEditing(null); setNote('') }
  }
  function edit(r: Workout) { setEditing(r.id); setDate(r.date); setExercise(r.exercise); setCategory(r.category ?? catalog.find(e => e.name === r.exercise)?.category ?? 'その他'); setWeight(String(r.weight)); setReps(String(r.reps)); setSets(String(r.sets)); setNote(r.note); setNotice(''); document.getElementById('record-form')?.scrollIntoView({ behavior: 'smooth' }) }
  const visible = records.filter(r => !filter || r.date === filter).sort((a, b) => b.date.localeCompare(a.date))
  const dates = [...new Set(visible.map(r => r.date))]
  const current = records.filter(r => r.date === today())
  return (
    <div className="app">
      <header><a className="brand" href="#"><span className="brand-icon" aria-hidden="true">▥</span> LIFT LOG</a><span className="header-note">小さな積み重ねを、強さに。</span></header>
      <main>
        <div className="intro"><span className="eyebrow">YOUR TRAINING JOURNAL</span><h1>今日の一歩を、記録しよう。</h1><p>トレーニングを振り返って、次の自分につなげよう。</p></div>
        <section className="stats" aria-label="トレーニングの集計">
          <div><span>トレーニング日数</span><strong>{new Set(records.map(r => r.date)).size}<small>日</small></strong></div>
          <div><span>今日のセット数</span><strong>{number(current.reduce((s, r) => s + r.sets, 0))}<small>セット</small></strong></div>
          <div><span>今日の総負荷量</span><strong>{number(current.reduce((s, r) => s + r.weight * r.reps * r.sets, 0))}<small>kg</small></strong></div>
        </section>
        {catalogInitial.error && <div role="alert" className="error">{catalogInitial.error}</div>}
        {error && <div role="alert" className="error">{error}</div>}
        <p role="status" className="notice">{notice}</p>
        <div className="workspace">
          <section className="panel form-panel" id="record-form">
            <div className="panel-title"><span className="eyebrow">RECORD</span><h2>{editing ? '記録を編集' : 'トレーニングを追加'}</h2></div>
            <form onSubmit={submit}>
              <label>日付<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
              <ExercisePicker category={category} exercise={exercise} exercises={catalog} onChange={(part, name) => { setCategory(part); setExercise(name) }} onAdd={addExercise} />
              <div className="number-fields">
                <label>重量 (kg)<input type="number" min="0" max="10000" step="0.1" required value={weight} onChange={e => setWeight(e.target.value)} /></label>
                <label>回数<input type="number" min="1" max="10000" step="1" required value={reps} onChange={e => setReps(e.target.value)} /></label>
                <label>セット数<input type="number" min="1" max="1000" step="1" required value={sets} onChange={e => setSets(e.target.value)} /></label>
              </div>
              <p className="hint">自重トレーニングは重量を 0 kg にしてください。</p>
              <label>メモ <span className="optional">任意</span><textarea rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="フォームや調子、次回の目標など" /></label>
              <button className="primary" type="submit">{editing ? '変更を保存' : '＋ 記録を追加'}</button>
              {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setNote('') }}>編集をキャンセル</button>}
            </form>
          </section>
          <section className="history">
            <div className="history-heading"><div><span className="eyebrow">HISTORY</span><h2>トレーニング履歴</h2></div><span className="count">{visible.length} 件</span></div>
            <div className="filter"><label htmlFor="filter-date">日付で絞り込み</label><input id="filter-date" type="date" value={filter} onChange={e => setFilter(e.target.value)} />{filter && <button className="text-button" onClick={() => setFilter('')}>解除</button>}</div>
            {visible.length === 0 ? <div className="empty"><div aria-hidden="true">＋</div><h3>{filter ? 'この日の記録はありません' : '最初のトレーニングを記録しよう'}</h3><p>{filter ? '日付を変更するか、新しく記録を追加してください。' : '種目と回数を入力して、今日の頑張りを残しましょう。'}</p></div> : dates.map(day => {
              const rows = visible.filter(r => r.date === day)
              return <section className="day" key={day}><div className="day-heading"><h3>{new Date(`${day}T00:00:00`).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', year: 'numeric' })}{day === today() && <span className="today">今日</span>}</h3><span>{rows.reduce((s, r) => s + r.sets, 0)} セット</span></div>
                {rows.map(r => <article className="record" key={r.id}><div className="record-main"><div><h4>{r.exercise}</h4><p className="metrics"><strong>{number(r.weight)}</strong> kg <span>×</span> <strong>{r.reps}</strong> 回 <span>×</span> <strong>{r.sets}</strong> セット</p></div><div className="actions"><button onClick={() => edit(r)} aria-label={`${r.exercise}の記録を編集`}>編集</button><button onClick={() => setDeleting(r.id)} aria-label={`${r.exercise}の記録を削除`}>削除</button></div></div>{r.note && <p className="record-note">{r.note}</p>}{deleting === r.id && <div className="delete-confirm"><span>この記録を削除しますか？</span><button className="danger" onClick={() => { if (save(records.filter(item => item.id !== r.id), '記録を削除しました。')) { setDeleting(null); if (editing === r.id) { setEditing(null); setNote('') } } }}>削除する</button><button onClick={() => setDeleting(null)}>キャンセル</button></div>}</article>)}
              </section>
            })}
          </section>
        </div>
        <footer>記録はこのブラウザに保存されます。<span>総負荷量 = 重量 × 回数 × セット数</span></footer>
      </main>
    </div>
  )
}
export default App
