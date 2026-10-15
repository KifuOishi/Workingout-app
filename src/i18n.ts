export type Language = 'en' | 'ja' | 'es' | 'zh'
export type Unit = 'kg' | 'lb'
export const locales = { en: 'en-US', ja: 'ja-JP', es: 'es-ES', zh: 'zh-CN' }
export const messages = {
  tagline: ['Small steps. Stronger you.', '小さな積み重ねを、強さに。', 'Pequeños pasos. Más fuerza.', '积少成多，变得更强。'],
  journal: ['YOUR TRAINING JOURNAL', 'トレーニング日誌', 'TU DIARIO DE ENTRENAMIENTO', '你的训练日志'],
  title: ['Make every rep count.', '今日の一歩を、記録しよう。', 'Cada repetición cuenta.', '记录每一次进步。'],
  subtitle: ['Track your training. Build your next personal best.', 'トレーニングを振り返って、次の自分につなげよう。', 'Registra tus entrenamientos y supera tus marcas.', '回顾训练，迎接下一个突破。'],
  summary: ['Training summary', 'トレーニングの集計', 'Resumen de entrenamiento', '训练统计'],
  days: ['Training days', 'トレーニング日数', 'Días de entrenamiento', '训练天数'],
  dayUnit: ['days', '日', 'días', '天'],
  todaySets: ["Today’s sets", '今日のセット数', 'Series de hoy', '今日组数'],
  volume: ["Today’s volume", '今日の総負荷量', 'Volumen de hoy', '今日训练总量'],
  sets: ['sets', 'セット', 'series', '组'],
  reps: ['reps', '回数', 'repeticiones', '次数'],
  record: ['RECORD', '記録', 'REGISTRO', '记录'],
  addWorkout: ['Add workout', 'トレーニングを追加', 'Añadir entrenamiento', '添加训练'],
  editWorkout: ['Edit workout', '記録を編集', 'Editar entrenamiento', '编辑训练'],
  date: ['Date', '日付', 'Fecha', '日期'],
  weight: ['Weight', '重量', 'Peso', '重量'],
  bodyweight: ['For bodyweight exercises, enter 0', '自重トレーニングは重量を0にしてください', 'Para ejercicios con peso corporal, introduce 0', '自重训练的重量请输入0'],
  note: ['Notes', 'メモ', 'Notas', '备注'],
  optional: ['Optional', '任意', 'Opcional', '选填'],
  notePlaceholder: ['Form, how you felt, or goals for next time', 'フォームや調子、次回の目標など', 'Técnica, sensaciones u objetivos para la próxima vez', '动作、状态或下次目标'],
  save: ['Save changes', '変更を保存', 'Guardar cambios', '保存修改'],
  addRecord: ['＋ Add record', '＋ 記録を追加', '＋ Añadir registro', '＋ 添加记录'],
  cancelEdit: ['Cancel editing', '編集をキャンセル', 'Cancelar edición', '取消编辑'],
  historyLabel: ['HISTORY', '履歴', 'HISTORIAL', '历史'],
  history: ['Workout history', 'トレーニング履歴', 'Historial de entrenamientos', '训练历史'],
  records: ['records', '件', 'registros', '条'],
  filter: ['Filter by date', '日付で絞り込み', 'Filtrar por fecha', '按日期筛选'],
  clear: ['Clear', '解除', 'Quitar filtro', '清除'],
  noDay: ['No workouts on this day', 'この日の記録はありません', 'No hay entrenamientos este día', '当天暂无记录'],
  first: ['Log your first workout', '最初のトレーニングを記録しよう', 'Registra tu primer entrenamiento', '记录你的第一次训练'],
  noDayHint: ['Choose another date or add a new record.', '日付を変更するか、新しく記録を追加してください。', 'Elige otra fecha o añade un registro.', '请选择其他日期或添加记录。'],
  firstHint: ['Choose an exercise and capture your effort today.', '種目と回数を入力して、今日の頑張りを残しましょう。', 'Elige un ejercicio y registra tu esfuerzo de hoy.', '选择动作，记录今天的努力。'],
  today: ['Today', '今日', 'Hoy', '今天'],
  edit: ['Edit', '編集', 'Editar', '编辑'],
  delete: ['Delete', '削除', 'Eliminar', '删除'],
  confirmDelete: ['Delete this record?', 'この記録を削除しますか？', '¿Eliminar este registro?', '确定删除这条记录？'],
  cancel: ['Cancel', 'キャンセル', 'Cancelar', '取消'],
  local: ['Records are saved in this browser.', '記録はこのブラウザに保存されます。', 'Los registros se guardan en este navegador.', '记录保存在此浏览器中。'],
  formula: ['Volume = weight × reps × sets', '総負荷量 = 重量 × 回数 × セット数', 'Volumen = peso × repeticiones × series', '训练总量 = 重量 × 次数 × 组数'],
  category: ['Muscle group', '部位', 'Grupo muscular', '肌群'],
  exercise: ['Exercise', '種目', 'Ejercicio', '动作'],
  choose: ['Choose an exercise', '種目を選択してください', 'Elige un ejercicio', '请选择动作'],
  past: ['Previous record', '過去の記録', 'Registro anterior', '历史记录'],
  closeAdd: ['Close exercise form', '種目の追加を閉じる', 'Cerrar formulario de ejercicio', '关闭动作添加'],
  customAdd: ['＋ Add an exercise to', '＋ 自分の種目を追加：', '＋ Añadir un ejercicio a', '＋ 添加自定义动作：'],
  customName: ['New exercise name', '追加する種目名', 'Nombre del nuevo ejercicio', '新动作名称'],
  customPlaceholder: ['e.g. My custom exercise', '例：自分用のトレーニング', 'Ej.: Mi ejercicio personalizado', '例如：我的自定义动作'],
  customHint: ['Saved exercises will be available next time.', '追加した種目は、次回からも選べます。', 'Los ejercicios guardados estarán disponibles la próxima vez.', '保存后，下次也可以选择此动作。'],
  customSave: ['Save and select exercise', '種目を保存して選択', 'Guardar y seleccionar ejercicio', '保存并选择动作'],
  nameError: ['Enter an exercise name (1–80 characters).', '種目名を1〜80文字で入力してください。', 'Introduce un nombre de 1 a 80 caracteres.', '请输入1至80个字符的动作名称。'],
  duplicate: ['This exercise already exists in this muscle group.', 'この部位には同じ名前の種目が登録されています。', 'Este ejercicio ya existe en este grupo muscular.', '此肌群中已存在同名动作。'],
  saveError: ['Could not save. Check browser storage settings and space.', '保存できませんでした。ブラウザの保存設定や空き容量を確認してください。', 'No se pudo guardar. Revisa el espacio y los ajustes del navegador.', '无法保存，请检查浏览器存储设置和可用空间。'],
  loadError: ['Could not load saved records. Check browser storage settings.', '保存済みの記録を読み込めませんでした。ブラウザの保存設定を確認してください。', 'No se pudieron cargar los registros. Revisa los ajustes del navegador.', '无法读取记录，请检查浏览器存储设置。'],
  catalogError: ['Could not load custom exercises. Check browser storage settings.', '追加した種目を読み込めませんでした。ブラウザの保存設定を確認してください。', 'No se pudieron cargar los ejercicios personalizados.', '无法读取自定义动作，请检查浏览器存储设置。'],
  invalid: ['Enter an exercise, date, and valid weight, reps and sets.', '種目と日付、正しい重量・回数・セット数を入力してください。', 'Introduce un ejercicio, una fecha y valores válidos de peso, repeticiones y series.', '请输入动作、日期和有效的重量、次数及组数。'],
  added: ['Workout recorded.', 'トレーニングを記録しました。', 'Entrenamiento registrado.', '训练已记录。'],
  updated: ['Record updated.', '記録を更新しました。', 'Registro actualizado.', '记录已更新。'],
  deleted: ['Record deleted.', '記録を削除しました。', 'Registro eliminado.', '记录已删除。'],
  exerciseAdded: ['Exercise added.', '種目を追加しました。', 'Ejercicio añadido.', '动作已添加。'],
  language: ['Language', '言語', 'Idioma', '语言'],
  unit: ['Weight unit', '重量単位', 'Unidad de peso', '重量单位'],
} satisfies Record<string, [string, string, string, string]>
export type MessageKey = keyof typeof messages
export function translator(language: Language) {
  const index = ['en', 'ja', 'es', 'zh'].indexOf(language)
  return (key: MessageKey) => messages[key][index]
}
export type Translate = ReturnType<typeof translator>
export function readSettings(): { language: Language; unit: Unit } {
  try {
    const data = JSON.parse(localStorage.getItem('workingout.settings.v1') ?? '{}')
    return { language: ['en', 'ja', 'es', 'zh'].includes(data?.language) ? data.language : 'en', unit: data?.unit === 'lb' ? 'lb' : 'kg' }
  } catch { return { language: 'en', unit: 'kg' } }
}
export const toKg = (value: number, unit: Unit) => unit === 'lb' ? value * 0.45359237 : value
export const fromKg = (value: number, unit: Unit) => unit === 'lb' ? value / 0.45359237 : value
