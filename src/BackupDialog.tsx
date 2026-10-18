import useNotice from './useNotice'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { BackupError, backupMaxBytes, createBackup, parseBackup, restoreBackup } from './backup'
import type { Backup } from './backup'
import { locales } from './i18n'
import type { Language, MessageKey, Translate } from './i18n'
import { localDate } from './workouts'

export default function BackupDialog({ t, language, onClose, onRestored }: { t: Translate; language: Language; onClose: () => void; onRestored: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<{ backup: Backup; name: string } | null>(null)
  const [error, setError] = useState<MessageKey | null>(null)
  const [notice, setNotice] = useNotice()
  const [loading, setLoading] = useState(false)
  const revision = useRef(0)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { element?.close() }
  }, [])
  function download() {
    try {
      const backup = createBackup()
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      if (blob.size > backupMaxBytes) throw new Error()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `lift-log-backup-${localDate()}-${Date.now()}.json`
      document.body.append(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setError(null); setNotice('backupDownloaded')
    } catch { setError('backupExportError'); setNotice(null) }
  }
  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const token = ++revision.current
    setPending(null); setNotice(null); setError(null)
    if (file.size > backupMaxBytes) { setError('backupTooLarge'); return }
    setLoading(true)
    try {
      const backup = parseBackup(await file.text())
      if (token === revision.current) setPending({ backup, name: file.name })
    } catch { if (token === revision.current) setError('backupInvalid') }
    finally { if (token === revision.current) setLoading(false) }
  }
  function restore() {
    if (!pending) return
    try { restoreBackup(pending.backup); onRestored() }
    catch (error) { setError(error instanceof BackupError ? error.code : 'backupSaveError') }
  }
  return <dialog ref={dialog} className="backup-dialog" aria-labelledby="backup-title" onCancel={onClose}>
    <div className="backup-dialog-header"><div><span className="eyebrow">LIFT LOG / DATA</span><h2 id="backup-title">{t('backup')}</h2></div><button type="button" className="secondary" onClick={onClose}>{t('close')}</button></div>
    <p>{t('backupHint')}</p><p className="backup-scope">{t('backupScope')}</p>
    <div className="backup-actions"><button type="button" className="primary" onClick={download}>{t('exportBackup')}</button><label className="secondary backup-file-label">{t('importBackup')}<input type="file" accept=".json,application/json" aria-label={t('importBackup')} onChange={e => void choose(e)} disabled={loading} /></label></div>
    {notice && <p role="status" className="notice">{t(notice)}</p>}
    {error && <p role="alert" className="error">{t(error)}</p>}
    {pending && <section className="backup-preview"><h3>{t('backupPreview')}</h3><p className="backup-filename">{pending.name}</p><dl><div><dt>{t('backupCreated')}</dt><dd>{new Date(pending.backup.exportedAt).toLocaleString(locales[language])}</dd></div><div><dt>{t('records')}</dt><dd>{pending.backup.data.records.length}</dd></div><div><dt>{t('templates')}</dt><dd>{pending.backup.data.planner.templates.length}</dd></div><div><dt>{t('exercise')}</dt><dd>{pending.backup.data.exercises.length}</dd></div><div><dt>{t('activeWorkout')}</dt><dd>{pending.backup.data.planner.session ? 1 : 0}</dd></div></dl><p className="backup-replace">{t('backupReplace')}</p><div className="planner-actions"><button type="button" className="primary" onClick={restore}>{t('restoreBackup')}</button><button type="button" className="text-button" onClick={() => { setPending(null); setError(null) }}>{t('cancel')}</button></div></section>}
  </dialog>
}
