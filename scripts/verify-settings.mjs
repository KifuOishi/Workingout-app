import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Render the real components with browser storage fixtures, without a browser.
const require = createRequire(import.meta.url)
const modules = new Map()
function moduleUrl(file) {
  if (modules.has(file)) return modules.get(file)
  let source = fs.readFileSync(file, 'utf8').replace(/^import ['"].*\.css['"]\s*$/gm, '')
  source = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText
  source = source.replace(/from\s+(['"])([^'"]+)\1/g, (_, quote, specifier) => {
    const url = specifier.startsWith('.')
      ? moduleUrl([specifier + '.ts', specifier + '.tsx'].map(p => path.resolve(path.dirname(file), p)).find(p => fs.existsSync(p)))
      : pathToFileURL(require.resolve(specifier)).href
    return `from ${quote}${url}${quote}`
  })
  const url = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
  modules.set(file, url)
  return url
}
const { default: App } = await import(moduleUrl(path.resolve('src/App.tsx')))
const { fromKg, toKg, messages, readSettings, translator } = await import(moduleUrl(path.resolve('src/i18n.ts')))
const { defaultExercises, categories } = await import(moduleUrl(path.resolve('src/exercises.ts')))
const { exerciseLabel, categoryLabel } = await import(moduleUrl(path.resolve('src/exerciseLabels.ts')))
const storage = new Map()
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
assert.deepEqual(readSettings(), { language: 'en', unit: 'kg' })
storage.set('workingout.settings.v1', 'invalid')
assert.deepEqual(readSettings(), { language: 'en', unit: 'kg' })
storage.set('workingout.settings.v1', JSON.stringify({ language: 'xx', unit: 'oz' }))
assert.deepEqual(readSettings(), { language: 'en', unit: 'kg' })
assert.equal(toKg(100, 'lb'), 45.359237)
assert.ok(Math.abs(fromKg(20, 'lb') - 44.09245243697551) < 1e-10)
for (const value of [0, 0.1, 20, 45.359237, 500]) {
  assert.ok(Math.abs(toKg(fromKg(value, 'lb'), 'lb') - value) < 1e-10)
}
const legacy = { id: 'legacy', date: '2026-10-15', exercise: defaultExercises[0].name, weight: 20, reps: 10, sets: 3, note: 'My note' }
storage.set('workingout.records.v1', JSON.stringify([legacy]))
storage.set('workingout.exercises.v1', JSON.stringify([{ category: categories[0], name: 'My custom exercise' }]))
for (const language of ['en', 'ja', 'es', 'zh']) {
  for (const values of Object.values(messages)) assert.ok(values[['en', 'ja', 'es', 'zh'].indexOf(language)].length > 0)
  for (const exercise of defaultExercises) {
    assert.ok(exerciseLabel(exercise.name, language))
    if (language !== 'ja') assert.notEqual(exerciseLabel(exercise.name, language), exercise.name)
  }
  assert.equal(exerciseLabel('My custom exercise', language), 'My custom exercise')
  for (const unit of ['kg', 'lb']) {
    storage.set('workingout.settings.v1', JSON.stringify({ language, unit }))
    assert.deepEqual(readSettings(), { language, unit })
    const html = ['home', 'templates', 'history'].map(page => { globalThis.window = { location: { hash: '#/' + page } }; return renderToStaticMarkup(createElement(App)) }).join('')
    const t = translator(language)
    assert.ok(html.includes(t('title')))
    assert.ok(html.includes(t('templates')))
    assert.ok(html.includes(t('sets')))
    assert.ok(html.includes(categoryLabel(categories[0], language)))
    assert.ok(html.includes(exerciseLabel(legacy.exercise, language)))

    assert.ok(html.includes('My note'))
    const expected = fromKg(legacy.weight, unit).toLocaleString({ en: 'en-US', ja: 'ja-JP', es: 'es-ES', zh: 'zh-CN' }[language], { maximumFractionDigits: 2 })
    assert.ok(html.includes(`<strong>${expected}</strong> ${unit}`))
    assert.equal(JSON.parse(storage.get('workingout.records.v1'))[0].weight, 20)
  }
}
console.log('PASS: four languages, 48 exercise translations, eight language/unit renders, legacy records, custom names, settings reload, kg/lb conversion')
