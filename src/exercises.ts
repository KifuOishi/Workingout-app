export const categories = ['胸', '肩', '背中', '脚', '腕', '腹', 'その他'] as const
export type Category = typeof categories[number]
export const equipmentTypes = ['barbell', 'dumbbell', 'machine', 'bodyweightWeighted', 'bodyweightAssisted', 'repsOnly', 'cardio', 'duration'] as const
export type Equipment = typeof equipmentTypes[number]
export type Exercise = { category: Category; name: string; equipment?: Equipment }
export const validEquipment = (equipment: unknown) => equipment === undefined || equipmentTypes.includes(equipment as Equipment)
export const assistedNames = ['アシストチンニング', 'アシストディップス', 'Assisted chin-up', 'Assisted dip']
export const isAssisted = (name: string) => assistedNames.some(value => value.toLowerCase() === name.trim().toLowerCase())
export const signedWeight = (name: string, kg: number) => isAssisted(name) ? -Math.abs(kg) : kg
const presets: Record<Category, string[]> = {
  胸: ['ベンチプレス', 'インクラインベンチプレス', 'ダンベルプレス', 'ダンベルフライ', 'ケーブルクロスオーバー', 'チェストプレス', '腕立て伏せ', 'ディップス'],
  肩: ['ショルダープレス', 'ダンベルショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ', 'フェイスプル', 'アーノルドプレス'],
  背中: ['デッドリフト', 'ラットプルダウン', '懸垂', 'ベントオーバーロウ', 'ワンハンドロウ', 'シーテッドロウ', 'バックエクステンション'],
  脚: ['スクワット', 'レッグプレス', 'ブルガリアンスクワット', 'ランジ', 'レッグエクステンション', 'レッグカール', 'ルーマニアンデッドリフト', 'ヒップスラスト', 'カーフレイズ'],
  腕: ['ダンベルカール', 'バーベルカール', 'ハンマーカール', 'プリーチャーカール', 'トライセプスプレスダウン', 'フレンチプレス', 'トライセプスキックバック'],
  腹: ['クランチ', 'シットアップ', 'レッグレイズ', 'アブローラー', 'バイシクルクランチ', 'ケーブルクランチ', 'リバースクランチ'],
  その他: ['バーピー', 'ケトルベルスイング', 'ファーマーズウォーク'],
}
const presetEquipment: Record<Category, Equipment[]> = {
  胸: ['barbell', 'barbell', 'dumbbell', 'dumbbell', 'machine', 'machine', 'repsOnly', 'bodyweightWeighted'],
  肩: ['barbell', 'dumbbell', 'dumbbell', 'dumbbell', 'dumbbell', 'machine', 'dumbbell'],
  背中: ['barbell', 'machine', 'bodyweightWeighted', 'barbell', 'dumbbell', 'machine', 'bodyweightWeighted'],
  脚: ['barbell', 'machine', 'dumbbell', 'dumbbell', 'machine', 'machine', 'barbell', 'barbell', 'machine'],
  腕: ['dumbbell', 'barbell', 'dumbbell', 'barbell', 'machine', 'dumbbell', 'dumbbell'],
  腹: ['repsOnly', 'repsOnly', 'repsOnly', 'machine', 'repsOnly', 'machine', 'repsOnly'],
  その他: ['cardio', 'machine', 'dumbbell'],
}
export const defaultExercises: Exercise[] = [...categories.flatMap(category => presets[category].map((name, index) => ({ category, name, equipment: presetEquipment[category][index] }))), { category: '背中', name: 'アシストチンニング', equipment: 'bodyweightAssisted' }, { category: '胸', name: 'アシストディップス', equipment: 'bodyweightAssisted' }]
export const exerciseStorageKey = 'workingout.exercises.v1'
export function readExercises(): { exercises: Exercise[]; error: string } {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(exerciseStorageKey) ?? '[]')
    if (!Array.isArray(data) || !data.every(e => e && validEquipment(e.equipment) && categories.includes(e.category) && typeof e.name === 'string' && e.name.trim().length > 0 && e.name.length <= 80)) throw new Error()
    return { exercises: data, error: '' }
  } catch { return { exercises: [], error: '追加した種目を読み込めませんでした。ブラウザの保存設定を確認してください。' } }
}
