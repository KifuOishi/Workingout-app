export const categories = ['胸', '肩', '背中', '脚', '腕', '腹', 'その他'] as const
export type Category = typeof categories[number]
export type Exercise = { category: Category; name: string }
const presets: Record<Category, string[]> = {
  胸: ['ベンチプレス', 'インクラインベンチプレス', 'ダンベルプレス', 'ダンベルフライ', 'ケーブルクロスオーバー', 'チェストプレス', '腕立て伏せ', 'ディップス'],
  肩: ['ショルダープレス', 'ダンベルショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ', 'フェイスプル', 'アーノルドプレス'],
  背中: ['デッドリフト', 'ラットプルダウン', '懸垂', 'ベントオーバーロウ', 'ワンハンドロウ', 'シーテッドロウ', 'バックエクステンション'],
  脚: ['スクワット', 'レッグプレス', 'ブルガリアンスクワット', 'ランジ', 'レッグエクステンション', 'レッグカール', 'ルーマニアンデッドリフト', 'ヒップスラスト', 'カーフレイズ'],
  腕: ['ダンベルカール', 'バーベルカール', 'ハンマーカール', 'プリーチャーカール', 'トライセプスプレスダウン', 'フレンチプレス', 'トライセプスキックバック'],
  腹: ['クランチ', 'シットアップ', 'レッグレイズ', 'アブローラー', 'バイシクルクランチ', 'ケーブルクランチ', 'リバースクランチ'],
  その他: ['バーピー', 'ケトルベルスイング', 'ファーマーズウォーク'],
}
export const defaultExercises: Exercise[] = categories.flatMap(category => presets[category].map(name => ({ category, name })))
export const exerciseStorageKey = 'workingout.exercises.v1'
export function readExercises(): { exercises: Exercise[]; error: string } {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(exerciseStorageKey) ?? '[]')
    if (!Array.isArray(data) || !data.every(e => e && categories.includes(e.category) && typeof e.name === 'string' && e.name.trim().length > 0 && e.name.length <= 80)) throw new Error()
    return { exercises: data, error: '' }
  } catch { return { exercises: [], error: '追加した種目を読み込めませんでした。ブラウザの保存設定を確認してください。' } }
}
