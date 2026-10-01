import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const previous = require.extensions['.ts']
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  })
  module._compile(outputText, filename)
}
const { STAGES, generateStageSet, fingerprint, GenerationError } = require('../src/features/stages/catalog.ts')
const { emptyState, startSession, selectAnswer, submitAnswer, advance, editSession, sessionScore,
  isUnlocked, nextStage, awardFor, addReview, resumable, recommendedReviews } = require('../src/features/stages/learning.ts')
const { decodeState, saveLearning, loadLearning, LEARNING_KEY, archiveBrokenSave } = require('../src/features/stages/storage.ts')
if (previous) require.extensions['.ts'] = previous
else delete require.extensions['.ts']

const active = state => state.sessions[state.activeKey]
function answer(state, correct) {
  const s = active(state), q = s.questions[s.index]
  return submitAnswer(selectAnswer(state, correct ? q.answer : q.choices.find(a => a !== q.answer)), 12)
}
function finish(state, score) {
  for (let i = 0; i < 10; i++) state = advance(answer(state, i < score))
  return state
}

test('全ステージ・CHECKが条件どおりの重複しない10問を返す', () => {
  for (const stage of STAGES) for (let repetition = 0; repetition < 8; repetition++) {
    const questions = generateStageSet(stage)
    assert.equal(questions.length, 10)
    assert.equal(new Set(questions.map(fingerprint)).size, 10)
    assert.deepEqual(['easy', 'normal', 'hard'].map(d => questions.filter(q => q.difficulty === d).length), [3, 5, 2])
    questions.forEach((q, i) => {
      assert.equal(q.stageId, stage.stageId)
      assert.equal(q.category, stage.slots[i].category)
      assert.ok(stage.slots[i].patternIds.includes(q.patternId))
    })
  }
})

test('問題文と選択肢、未確定の選択、メモと解説状態を保存・復元する', () => {
  let state = startSession(emptyState(), STAGES[0].stageId, 'practice')
  const original = structuredClone(active(state).questions)
  state = selectAnswer(state, original[0].choices[2])
  state = editSession(state, s => ({ ...s, notes: ['計算中', ...s.notes.slice(1)], ink: [{ width: 320, height: 800, strokes: [[{ x: 1, y: 2 }, { x: 3, y: 4 }]] }, ...s.ink.slice(1)] }))
  state = decodeState(JSON.stringify(state))
  assert.equal(active(state).selected, original[0].choices[2])
  assert.equal(active(state).notes[0], '計算中')
  state = submitAnswer(state)
  const beforeDoubleSubmit = state
  state = submitAnswer(state)
  assert.equal(state, beforeDoubleSubmit)
  assert.equal(state.history.length, 1)
  state = decodeState(JSON.stringify(state))
  assert.equal(active(state).phase, 'feedback')
  assert.equal(active(state).feedbackOpen, true)
  assert.deepEqual(active(state).questions, original)
  state = editSession(state, s => ({ ...s, feedbackOpen: false }))
  assert.equal(active(decodeState(JSON.stringify(state))).feedbackOpen, false)
  state = advance(state)
  assert.equal(active(state).index, 1)
  assert.equal(active(state).selected, null)
  assert.equal(active(state).ink[1], null)
})

test('0点完走でも解放する。最後の解説中の再読込でも二重計上しない', () => {
  let state = startSession(emptyState(), STAGES[0].stageId, 'practice')
  assert.equal(isUnlocked(state, STAGES[1].stageId), false)
  for (let i = 0; i < 9; i++) state = advance(answer(state, false))
  assert.equal(isUnlocked(state, STAGES[1].stageId), false)
  state = answer(state, false)
  assert.equal(active(state).phase, 'feedback')
  assert.equal(active(state).completed, true)
  assert.equal(state.progress[STAGES[0].stageId].bestScore, 0)
  assert.equal(isUnlocked(state, STAGES[1].stageId), true)
  assert.ok(state.reviews[STAGES[0].stageId])
  assert.deepEqual(state.newIds, [STAGES[1].stageId])
  state = decodeState(JSON.stringify(state))
  state = advance(state)
  state = submitAnswer(state)
  assert.equal(state.history.length, 10)
  assert.equal(active(state).phase, 'result')
})

test('通常5ステージ→CHECK→06、最後のCHECKまで低得点で進める', () => {
  let state = emptyState()
  for (const stage of STAGES) {
    assert.equal(nextStage(state).stageId, stage.stageId)
    state = finish(startSession(state, stage.stageId, 'practice'), 0)
    state = decodeState(JSON.stringify(state))
  }
  assert.equal(nextStage(state), undefined)
  assert.equal(Object.keys(state.progress).length, 12)
  assert.equal(state.history.length, 120)
  assert.equal(STAGES.filter(s => s.kind === 'stage').length, 10)
})

test('得点境界・最高評価保持・自動/任意の復習追加を区別する', () => {
  for (const points of [0, 5, 6, 7, 9, 10]) {
    let state = finish(startSession(emptyState(), STAGES[0].stageId, 'practice'), points)
    assert.equal(awardFor(points), points === 10 ? 'perfect' : points >= 6 ? 'clear' : undefined)
    assert.equal(Boolean(state.reviews[STAGES[0].stageId]), points <= 6)
    if (points === 7 || points === 9) {
      state = addReview(state, active(state).plan)
      state = addReview(state, active(state).plan)
      assert.equal(Object.keys(state.reviews).length, 1)
    }
  }
  let state = finish(startSession(emptyState(), STAGES[0].stageId, 'practice'), 10)
  state = finish(startSession(state, STAGES[0].stageId, 'practice'), 0)
  assert.equal(state.progress[STAGES[0].stageId].bestScore, 10)
  assert.equal(state.progress[STAGES[0].stageId].lastScore, 0)
})

test('復習は登録時の条件から再生成し、7点で解除。進行・最高評価を更新しない', () => {
  let state = finish(startSession(emptyState(), STAGES[0].stageId, 'practice'), 3)
  const originalIds = active(state).questions.map(q => q.id)
  const progress = structuredClone(state.progress)
  state = startSession(state, STAGES[0].stageId, 'review')
  assert.ok(active(state).questions.every(q => !originalIds.includes(q.id)))
  assert.deepEqual(active(state).plan, state.reviews[STAGES[0].stageId].plan)
  state = finish(state, 6)
  assert.ok(state.reviews[STAGES[0].stageId])
  state = finish(startSession(state, STAGES[0].stageId, 'review'), 7)
  assert.equal(state.reviews[STAGES[0].stageId], undefined)
  assert.deepEqual(state.progress, progress)
  assert.equal(sessionScore(active(state)), 7)
})

test('通常再挑戦では復習解除しない。CHECKも同じ出題条件で復習できる', () => {
  let state = emptyState()
  for (const stage of STAGES.slice(0, 6)) state = finish(startSession(state, stage.stageId, 'practice'), 0)
  const check = STAGES[5]
  state = finish(startSession(state, STAGES[0].stageId, 'practice'), 10)
  assert.ok(state.reviews[STAGES[0].stageId])
  state = startSession(state, check.stageId, 'review')
  assert.equal(active(state).plan.kind, 'check')
  assert.deepEqual(active(state).plan.slots, check.slots)
  assert.equal(recommendedReviews(state)[0].plan.stageId, STAGES[0].stageId)
})

test('途中セットを複数保持し、最後に開いた未完セットから再開する', () => {
  let state = finish(startSession(emptyState(), STAGES[0].stageId, 'practice'), 0)
  state = startSession(state, STAGES[1].stageId, 'practice')
  const practiceId = active(state).id
  state = advance(answer(state, true))
  state = startSession(state, STAGES[0].stageId, 'review')
  const reviewId = active(state).id
  state = advance(answer(state, false))
  assert.equal(resumable(state).id, reviewId)
  state = startSession(state, STAGES[1].stageId, 'practice')
  assert.equal(active(state).id, practiceId)
  assert.equal(active(state).index, 1)
  assert.equal(resumable(state).id, practiceId)
})

test('生成エラー・未解放選択で元の回答済みデータを変更しない', () => {
  let state = startSession(emptyState(), STAGES[0].stageId, 'practice')
  state = advance(answer(state, true))
  const before = JSON.stringify(state)
  assert.throws(() => startSession(state, STAGES[2].stageId, 'practice'))
  const badPlan = { ...STAGES[0], slots: STAGES[0].slots.map(slot => ({ ...slot, patternIds: ['missing'] })) }
  assert.throws(() => generateStageSet(badPlan), GenerationError)
  assert.equal(JSON.stringify(state), before)
})

test('破損した保存データと未知バージョンを拒否し、元データを上書きしない', () => {
  const valid = startSession(emptyState(), STAGES[0].stageId, 'practice')
  for (const mutate of [s => { s.version = 2 }, s => { active(s).index = 12 }, s => { active(s).answers[2] = active(s).questions[2].answer },
    s => { active(s).questions[0].choices = ['broken'] }, s => { s.activeKey = 'missing' }, s => { active(s).plan.slots = [] },
    s => { active(s).ink[0] = { width: -1, height: 2, strokes: [] } }]) {
    const broken = structuredClone(valid)
    mutate(broken)
    assert.throws(() => decodeState(JSON.stringify(broken)))
  }
  const memory = new Map([[LEARNING_KEY, '{bad']])
  const old = globalThis.localStorage
  globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
  try {
    assert.ok(loadLearning().error)
    assert.equal(memory.get(LEARNING_KEY), '{bad')
    archiveBrokenSave()
    assert.ok([...memory.entries()].some(([key, value]) => key.startsWith(`${LEARNING_KEY}-recovery-`) && value === '{bad'))
    assert.equal(loadLearning().error, null)
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceeded') }
    assert.throws(() => saveLearning(valid), /QuotaExceeded/)
  } finally { if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old }
})
