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
const { categoryForStage, getCategoryStages } = require('../src/features/problems/categoryMap.ts')
const { PROBLEM_CATEGORIES, generateProblem } = require('../src/features/problems/problemGenerator.ts')
const { checkAnswer, createAnswerRecord } = require('../src/features/answers/checkAnswer.ts')
if (previous) require.extensions['.ts'] = previous
else delete require.extensions['.ts']

test('履歴がなくても全分野を選択でき、選択した分野の問題が生成される', () => {
  const stages = getCategoryStages([])
  assert.deepEqual(stages.map(stage => stage.category), PROBLEM_CATEGORIES)
  assert.equal(new Set(stages.map(stage => stage.id)).size, PROBLEM_CATEGORIES.length)
  for (const stage of stages) {
    assert.equal(stage.played, false)
    assert.equal(stage.award, undefined)
    const category = categoryForStage(stage.id)
    assert.equal(category, stage.category)
    for (let i = 0; i < 10; i++) {
      assert.equal(generateProblem(category).category, stage.category)
    }
  }
})

test('サンプル用ID・未実装分野・不明IDは出題に渡さない', () => {
  for (const id of ['', 'verbal-stage-1', 'nonverbal-stage-6', 'CHECK', '言語', 'unknown']) {
    assert.equal(categoryForStage(id), undefined)
  }
})

test('既存回答履歴を再読込しても分野別のプレイ済み・CLEARを反映する', () => {
  const problem = generateProblem('表の読み取り')
  const incorrect = problem.choices.find(choice => choice !== problem.answer)
  const wrong = createAnswerRecord(problem, checkAnswer(problem, incorrect), 20)
  const correct = createAnswerRecord(problem, checkAnswer(problem, problem.answer), 12)
  const played = getCategoryStages([wrong]).find(stage => stage.category === problem.category)
  assert.equal(played.played, true)
  assert.equal(played.award, undefined)
  const restored = JSON.parse(JSON.stringify([correct, wrong]))
  const stages = getCategoryStages(restored)
  const cleared = stages.find(stage => stage.category === problem.category)
  assert.equal(cleared.played, true)
  assert.equal(cleared.award, 'clear')
  assert.ok(stages.filter(stage => stage.category !== problem.category).every(stage => !stage.played && !stage.award))
})
