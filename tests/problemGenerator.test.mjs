import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// アプリのビルド設定・依存関係を変更せず、TypeScriptをメモリ上で読み込む。
const require = createRequire(import.meta.url)
const previous = require.extensions['.ts']
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  })
  module._compile(outputText, filename)
}
const { PROBLEM_CATEGORIES, PROBLEM_PATTERNS, generateProblem, generateProblemByPattern, generateProblems } = require('../src/features/problems/problemGenerator.ts')
if (previous) require.extensions['.ts'] = previous
else delete require.extensions['.ts']

const numbers = text => [...text.matchAll(/\d+(?:\.\d+)?/g)].map(x => Number(x[0]))
const num = text => Number.parseFloat(text)
const nAnswer = (p, value, unit) => assert.equal(p.answer, `${value}${unit}`, p.question)
const permutations = array => array.length === 0 ? [[]] : array.flatMap((x, i) => permutations(array.filter((_, j) => i !== j)).map(rest => [x, ...rest]))
function combinations(array, k) {
  if (k === 0) return [[]]
  return array.flatMap((x, i) => combinations(array.slice(i + 1), k - 1).map(rest => [x, ...rest]))
}
const range = n => Array.from({ length: n }, (_, i) => i)
const fractionValue = s => s.includes('/') ? num(s) / Number(s.split('/')[1]) : num(s)
const checkProbability = (p, good, all) => {
  assert.ok(Math.abs(fractionValue(p.answer) - good / all) < 1e-12, p.question)
  for (const choice of p.choices) assert.ok(fractionValue(choice) >= 0 && fractionValue(choice) <= 1)
  assert.equal(new Set(p.choices.map(fractionValue)).size, 4)
}

// 問題文・表だけから独立に解く。解説や生成側の計算関数は正解根拠に使わない。
const solve = {
  'inference-schedule': p => {
    const names = p.question.match(/「(.+?)」/)[1].split('・')
    const [, b, a] = p.question.match(/。(.+?)は(.+?)より後/)
    const [, , c, gapText] = p.question.match(/、(.+?)と(.+?)の間にはちょうど(\d+)つ/)
    const [, d, e] = p.question.match(/また、(.+?)は(.+?)より先/)
    const valid = permutations(names).filter(order => {
      const pos = x => order.indexOf(x)
      return pos(b) > pos(a) && pos(c) - pos(a) === Number(gapText) + 1 && pos(d) < pos(e)
    })
    assert.ok(valid.length)
    assert.equal(p.answer, [...new Set(valid.map(order => order.indexOf(b) + 1))].sort().join('・') + '番目')
  },
  'inference-allocation': p => {
    const total = Number(p.question.match(/合計(\d+)個/)[1]), diff = Number(p.question.match(/Bより(\d+)個/)[1])
    const valid = []
    for (let a = 1; a < total; a++) for (let b = 1; b < total; b++) for (let c = 1; c < total; c++) {
      if (a + b + c === total && a - b === diff && c < b) valid.push(c)
    }
    nAnswer(p, Math.max(...valid), '個')
  },
  'inference-sufficiency': p => {
    const total = Number(p.question.match(/合計(\d+)個/)[1])
    const aInfo = p.question.match(/ア：(.+)。/)[1], bInfo = p.question.match(/イ：(.+)。/)[1]
    const left = [], right = []
    for (let a = 1; a < total; a++) {
      const b = total - a
      if (aInfo.includes('個') ? a - b === numbers(aInfo)[0] : a > b) left.push(a)
      if (bInfo.includes('偶数') ? b % 2 === 0 : b === numbers(bInfo)[0]) right.push(a)
    }
    const both = left.filter(x => right.includes(x))
    assert.ok(both.length, '条件の矛盾')
    assert.equal(p.answer, left.length === 1 ? right.length === 1 ? 'アだけでもイだけでも分かる' : 'アだけで分かるが、イだけでは分からない' : right.length === 1 ? 'イだけで分かるが、アだけでは分からない' : both.length === 1 ? '両方合わせれば分かるが、片方だけでは分からない' : '両方合わせても分からない')
  },
  'cases-selection': p => {
    const [a, b] = numbers(p.question)
    nAnswer(p, combinations(range(a + b), 3).filter(group => group.some(x => x < a)).length, '通り')
  },
  'cases-separation': p => {
    const [n] = numbers(p.question)
    nAnswer(p, permutations(range(n)).filter(order => Math.abs(order.indexOf(0) - order.indexOf(1)) > 1).length, '通り')
  },
  'cases-digits': p => {
    const digits = numbers(p.question.split('が書かれた')[0])
    let count = 0
    for (let n = 100; n <= 999; n++) {
      const ds = String(n).split('').map(Number)
      if (n % 3 === 0 && new Set(ds).size === 3 && ds.every(d => digits.includes(d))) count++
    }
    nAnswer(p, count, '通り')
  },
  'probability-complement': p => {
    const [n, a] = numbers(p.question), groups = combinations(range(n), 2)
    checkProbability(p, groups.filter(g => g.some(x => x < a)).length, groups.length)
  },
  'probability-exact': p => {
    const [a, b] = numbers(p.question), groups = combinations(range(a + b), 3)
    checkProbability(p, groups.filter(g => g.filter(x => x < a).length === 2).length, groups.length)
  },
  'probability-conditional': p => {
    const [a, b] = numbers(p.question), groups = combinations(range(a + b), 2).filter(g => g.some(x => x < a))
    checkProbability(p, groups.filter(g => g.every(x => x < a)).length, groups.length)
  },
  'sets-two': p => {
    const [total, a, b, none] = numbers(p.question)
    const both = a + b - total + none
    assert.ok(both >= 0 && both <= Math.min(a, b))
    nAnswer(p, both, '人')
  },
  'sets-three': p => {
    const [ab, bc, ca] = numbers(p.question), all = Number(p.question.match(/受講者(\d+)人/)[1])
    assert.ok([ab, bc, ca].every(n => n >= all))
    nAnswer(p, ab + bc + ca - 3 * all, '人')
  },
  'sets-exactly-one': p => {
    const total = numbers(p.question)[0]
    const a = Number(p.question.match(/Aが(\d+)人/)[1]), b = Number(p.question.match(/Bが(\d+)人/)[1]), c = Number(p.question.match(/Cが(\d+)人/)[1])
    const all = Number(p.question.match(/いるのは(\d+)人/)[1]), none = Number(p.question.match(/いないのは(\d+)人/)[1])
    const solutions = []
    for (let one = 0; one <= total; one++) {
      const two = total - none - all - one
      if (two >= 0 && one + 2 * two + 3 * all === a + b + c) solutions.push(one)
    }
    assert.equal(solutions.length, 1)
    nAnswer(p, solutions[0], '人')
  },
  'profit-reverse': p => {
    const [markup, discount, , profit] = numbers(p.question)
    assert.ok(Math.abs(num(p.answer) * ((1 + markup / 100) * (1 - discount / 100) - 1) - profit) < 1e-8)
  },
  'profit-stock': p => {
    const [count, , cost, , price, full, discounted] = numbers(p.question)
    nAnswer(p, Math.round(full * price + discounted * price * 0.8 - count * cost), '円')
  },
  'profit-tier': p => {
    const [, threshold, , price, rate, , count] = numbers(p.question)
    const bill = n => range(n).reduce((acc, i) => acc + price * (i < threshold ? 1 : 1 - rate / 100), 0)
    nAnswer(p, Math.round(bill(count) * 2 - bill(count * 2)), '円')
  },
  'speed-meeting': p => {
    const distance = Number(p.question.match(/距離は(\d+)m/)[1]), slow = Number(p.question.match(/分速(\d+)m/)[1]), kph = Number(p.question.match(/時速([\d.]+)km/)[1])
    assert.ok(Math.abs(num(p.answer) * (slow + kph * 1000 / 60) - distance) < 1e-8)
  },
  'speed-average': p => {
    const [distance, slow, fast, rest] = numbers(p.question)
    nAnswer(p, (2 * distance / (distance / slow + distance / fast + rest)).toFixed(1), 'm/分')
  },
  'speed-catchup': p => {
    const [slow, delay, fast, before, stop] = numbers(p.question)
    // 同じ時刻のP,Qの移動距離を等しく置いて解く。
    const t = (slow * delay + fast * stop) / (fast - slow)
    assert.ok(slow * (delay + before) > fast * before, '停止前に追いついていない')
    assert.ok(t > before + stop)
    nAnswer(p, t.toFixed(1), '分')
  },
  'ratio-nested': p => {
    const group = Number(p.question.match(/荷物の(\d+)%/)[1]), sub = Number(p.question.match(/うち(\d+)%/)[1]), count = Number(p.question.match(/荷物が(\d+)個/)[1])
    assert.ok(Number.isInteger(count))
    nAnswer(p, count * 10000 / group / sub * (100 - group) / 100, '個')
  },
  'ratio-mix': p => {
    const [low, initial, high, target] = numbers(p.question)
    assert.ok(Math.abs((low * initial + high * num(p.answer)) / (initial + num(p.answer)) - target) < 1e-10)
  },
  'ratio-change': p => {
    const [up, down] = numbers(p.question), current = (1 + up / 100) * (1 - down / 100)
    assert.equal(p.question.includes('減らす'), current > 1)
    nAnswer(p, (Math.abs(100 / current - 100)).toFixed(1), '%')
  },
  'table-base': p => {
    const [a, b] = p.tables[0].rows
    for (const row of [a, b]) assert.equal(row.slice(2).reduce((s, v) => s + num(v), 0), 100)
    const total = num(a[1]) * num(a[2]) / num(b[2])
    assert.ok(Number.isInteger(total))
    nAnswer(p, total * num(b[3]) / 100, '個')
  },
  'table-weighted': p => {
    const counts = p.tables[0].rows.map(r => num(r[1])), rates = p.tables[1].rows.map(r => num(r[1]))
    const done = counts.map((c, i) => c * rates[i] / 100)
    assert.ok(done.every(Number.isInteger))
    nAnswer(p, (done.reduce((a, b) => a + b) / counts.reduce((a, b) => a + b) * 100).toFixed(1), '%')
  },
  'table-growth': p => {
    const [old, recent] = p.tables[0].rows
    nAnswer(p, (num(recent[1]) * num(recent[2]) / (num(old[1]) * num(old[2]))).toFixed(2), '倍')
  },
  'table-fees': p => {
    const [people, hours] = numbers(p.question)
    const prices = p.tables[0].rows.map(([name, room, person, equipment]) => num(room) * hours * (name === 'A' && hours >= 3 ? 0.8 : 1) + num(person) * people + num(equipment))
    const difference = Math.round(Math.abs(prices[0] - prices[1]))
    assert.equal(p.answer, difference === 0 ? '両プランは同額' : `プラン${prices[0] < prices[1] ? 'A' : 'B'}が${difference}円安い`)
  },
}

function withRandom(random, fn) {
  const original = Math.random
  Math.random = random
  try { return fn() } finally { Math.random = original }
}
function seeded(seed) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32 }
}

for (const pattern of PROBLEM_PATTERNS) {
  test(`${pattern.category}: ${pattern.name} — 200乱数系列と境界値`, () => {
    assert.equal(typeof solve[pattern.id], 'function', 'すべてのパターンに独立検算が必要')
    const signatures = new Set()
    for (let i = 0; i < 202; i++) {
      const p = withRandom(i === 200 ? () => 0 : i === 201 ? () => 0.999999999 : seeded(Math.imul(i + 1, 0x9e3779b1)), () => generateProblemByPattern(pattern.id))
      assert.equal(p.category, pattern.category)
      assert.equal(p.difficulty, pattern.difficulty)
      assert.equal(p.choices.length, 4)
      assert.equal(new Set(p.choices).size, 4)
      assert.equal(p.choices.filter(c => c === p.answer).length, 1)
      assert.ok(p.question.length > 20 && p.explanation.length > 20)
      assert.doesNotMatch(JSON.stringify(p), /NaN|Infinity|undefined|\d+\.\d{7}/)
      for (const t of p.tables ?? []) for (const row of t.rows) assert.equal(row.length, t.headers.length)
      if (p.category === '表の読み取り') assert.ok(p.tables?.length)
      if (/[人個円通り]$/.test(p.answer) && /^\d/.test(p.answer)) assert.ok(Number.isInteger(num(p.answer)))
      solve[pattern.id](p)
      signatures.add(JSON.stringify([p.question, p.tables]))
    }
    assert.ok(signatures.size >= 2, '固定問題ではないこと')
  })
}

test('既存API・8分野×3難易度・ID・入力検証', () => {
  const ids = new Set()
  for (const category of PROBLEM_CATEGORIES) for (const difficulty of ['easy', 'normal', 'hard']) {
    const batch = generateProblems(10, { category, difficulty })
    assert.equal(batch.length, 10)
    for (const p of batch) {
      assert.equal(p.category, category)
      assert.equal(p.difficulty, difficulty)
      ids.add(p.id)
    }
  }
  assert.equal(ids.size, 240)
  assert.equal(generateProblem().difficulty, 'normal')
  assert.equal(generateProblems(0).length, 0)
  for (const count of [-1, 0.5, NaN, Infinity]) assert.throws(() => generateProblems(count), RangeError)
  assert.throws(() => generateProblemByPattern('missing'), RangeError)
  assert.throws(() => generateProblem('未対応'), RangeError)
})
