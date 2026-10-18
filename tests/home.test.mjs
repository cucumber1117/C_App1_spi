import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const oldTsx = require.extensions['.tsx'], oldCss = require.extensions['.css']
require.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
  })
  module._compile(outputText, filename)
}
require.extensions['.css'] = () => {}
const Home = require('../src/pages/home/home.tsx').default
if (oldTsx) require.extensions['.tsx'] = oldTsx
else delete require.extensions['.tsx']
if (oldCss) require.extensions['.css'] = oldCss
else delete require.extensions['.css']

function nodes(element) {
  if (!element || typeof element !== 'object') return []
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)]
}
function setup(overrides = {}) {
  const calls = []
  const props = {
    started: false, extraAvailable: false, mockAvailable: false,
    ...Object.fromEntries(['Continue', 'Map', 'Extra', 'Review', 'Mock', 'Performance'].map(name => [`on${name}`, () => calls.push(name)])),
    ...overrides,
  }
  const tree = Home(props)
  return { calls, buttons: nodes(tree).filter(n => n.type === 'button'), html: renderToStaticMarkup(tree) }
}
const content = element => renderToStaticMarkup(element).replace(/<[^>]*>/g, '')
const find = (buttons, label) => {
  const button = buttons.find(b => content(b).includes(label))
  assert.ok(button, label)
  return button
}

test('初回は学習開始、単元選択・復習・成績を既存コールバックへ通知する', () => {
  const { html, buttons, calls } = setup()
  assert.ok(html.includes('小さな一問が、'))
  assert.ok(!html.includes('続きから'))
  for (const label of ['学習を始める', '単元を選ぶ', '復習する', '成績を見る']) find(buttons, label).props.onClick()
  assert.deepEqual(calls, ['Map', 'Map', 'Review', 'Performance'])
  for (const button of buttons) assert.equal(button.props.type, 'button')
})

test('学習開始後は続きからを表示し、再開処理へ通知する', () => {
  const { html, buttons, calls } = setup({ started: true })
  assert.ok(html.includes('今日も、ひとつ。'))
  assert.ok(!html.includes('学習を始める'))
  find(buttons, '続きから').props.onClick()
  assert.deepEqual(calls, ['Continue'])
})

for (const extraAvailable of [false, true]) for (const mockAvailable of [false, true]) {
  test(`機能の利用可否 extra=${extraAvailable} mock=${mockAvailable}`, () => {
    const { buttons, calls } = setup({ extraAvailable, mockAvailable })
    for (const [label, available, name] of [['エクストラ', extraAvailable, 'Extra'], ['模擬試験', mockAvailable, 'Mock']]) {
      const button = find(buttons, label)
      assert.equal(button.props.disabled, !available)
      assert.equal(content(button).includes('準備中'), !available)
      if (available) { button.props.onClick(); assert.equal(calls.at(-1), name) }
      else assert.equal(button.props.onClick, undefined)
    }
    assert.equal(calls.length, Number(extraAvailable) + Number(mockAvailable))
  })
}
