import { categories, defaultExercises } from './exercises'
import type { Category } from './exercises'
import type { Language } from './i18n'

const groups = {
  en: ['Chest', 'Shoulders', 'Back', 'Legs', 'Arms', 'Abs', 'Other'],
  ja: categories,
  es: ['Pecho', 'Hombros', 'Espalda', 'Piernas', 'Brazos', 'Abdominales', 'Otros'],
  zh: ['胸部', '肩部', '背部', '腿部', '手臂', '腹部', '其他'],
}
const names = {
  en: ['Bench press', 'Incline bench press', 'Dumbbell press', 'Dumbbell fly', 'Cable crossover', 'Chest press', 'Push-up', 'Dip', 'Shoulder press', 'Dumbbell shoulder press', 'Lateral raise', 'Front raise', 'Rear delt raise', 'Face pull', 'Arnold press', 'Deadlift', 'Lat pulldown', 'Pull-up', 'Bent-over row', 'One-arm row', 'Seated row', 'Back extension', 'Squat', 'Leg press', 'Bulgarian split squat', 'Lunge', 'Leg extension', 'Leg curl', 'Romanian deadlift', 'Hip thrust', 'Calf raise', 'Dumbbell curl', 'Barbell curl', 'Hammer curl', 'Preacher curl', 'Triceps pushdown', 'French press', 'Triceps kickback', 'Crunch', 'Sit-up', 'Leg raise', 'Ab wheel rollout', 'Bicycle crunch', 'Cable crunch', 'Reverse crunch', 'Burpee', 'Kettlebell swing', 'Farmer’s walk'],
  es: ['Press de banca', 'Press de banca inclinado', 'Press con mancuernas', 'Aperturas con mancuernas', 'Cruces en polea', 'Press de pecho en máquina', 'Flexiones', 'Fondos', 'Press de hombros', 'Press de hombros con mancuernas', 'Elevaciones laterales', 'Elevaciones frontales', 'Elevaciones posteriores', 'Face pull', 'Press Arnold', 'Peso muerto', 'Jalón al pecho', 'Dominadas', 'Remo inclinado', 'Remo a una mano', 'Remo sentado', 'Extensiones de espalda', 'Sentadillas', 'Prensa de piernas', 'Sentadilla búlgara', 'Zancadas', 'Extensiones de piernas', 'Curl de piernas', 'Peso muerto rumano', 'Empuje de cadera', 'Elevaciones de gemelos', 'Curl con mancuernas', 'Curl con barra', 'Curl martillo', 'Curl predicador', 'Extensiones de tríceps en polea', 'Press francés', 'Patada de tríceps', 'Crunch abdominal', 'Abdominales', 'Elevaciones de piernas', 'Rueda abdominal', 'Crunch bicicleta', 'Crunch en polea', 'Crunch inverso', 'Burpees', 'Balanceo con pesa rusa', 'Paseo del granjero'],
  zh: ['杠铃卧推', '上斜卧推', '哑铃卧推', '哑铃飞鸟', '绳索夹胸', '器械推胸', '俯卧撑', '双杠臂屈伸', '肩上推举', '哑铃肩上推举', '侧平举', '前平举', '俯身飞鸟', '绳索面拉', '阿诺德推举', '硬拉', '高位下拉', '引体向上', '俯身划船', '单臂划船', '坐姿划船', '背部伸展', '深蹲', '腿举', '保加利亚分腿蹲', '弓步蹲', '腿屈伸', '腿弯举', '罗马尼亚硬拉', '臀推', '提踵', '哑铃弯举', '杠铃弯举', '锤式弯举', '牧师凳弯举', '绳索下压', '法式臂屈伸', '俯身臂屈伸', '卷腹', '仰卧起坐', '举腿', '健腹轮', '自行车卷腹', '绳索卷腹', '反向卷腹', '波比跳', '壶铃摆动', '农夫行走'],
}
export const categoryLabel = (category: Category, language: Language) => groups[language][categories.indexOf(category)] ?? category
export function exerciseLabel(name: string, language: Language) {
  const assisted = name === 'アシストチンニング' ? { en: 'Assisted chin-up', ja: name, es: 'Dominadas asistidas', zh: '辅助引体向上' } : name === 'アシストディップス' ? { en: 'Assisted dip', ja: name, es: 'Fondos asistidos', zh: '辅助双杠臂屈伸' } : null
  if (assisted) return assisted[language]
  if (language === 'ja') return name
  const index = defaultExercises.findIndex(e => e.name === name)
  return index < 0 ? name : names[language][index] ?? name
}
