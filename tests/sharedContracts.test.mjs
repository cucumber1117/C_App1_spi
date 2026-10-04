import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

// 仮想ソースをTypeScriptで型検査する。実装のスタブや一時ファイルは作らない。
const fixturePath = fileURLToPath(new URL('./__sharedContracts.fixture.ts', import.meta.url))
function check(source) {
  const options = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    verbatimModuleSyntax: true,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const originalGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (filename, languageVersion, onError, shouldCreateNewSourceFile) => (
    path.resolve(filename) === fixturePath
      ? ts.createSourceFile(filename, source, languageVersion, true)
      : originalGetSourceFile(filename, languageVersion, onError, shouldCreateNewSourceFile)
  )
  const program = ts.createProgram([fixturePath], options, host)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: filename => filename,
    getNewLine: () => '\n',
  }))
}

const imports = `
import type {
  Difficulty, ProblemCategory, SpiProblem,
  ExerciseRequest, ExerciseLauncher, UnitView, MockExamConfig, MockExamSet,
  GenerateUnitSet, GenerateExtraSet, GetMockExamConfig, GenerateMockSet,
} from '../src/features/exercises/contracts'
`

test('共通型をimportでき、開始要求・関数型・既存問題型を接続できる', () => {
  check(`${imports}
    import type { SpiProblem as ExistingProblem } from '../src/features/problems/core'
    declare const generateUnitSet: GenerateUnitSet
    declare const generateExtraSet: GenerateExtraSet
    declare const getMockExamConfig: GetMockExamConfig
    declare const generateMockSet: GenerateMockSet
    const category: ProblemCategory = '仕事算'
    const difficulty: Difficulty = 'normal'
    const unit: UnitView = { category, description: '共同作業', available: true, stageIds: ['example-stage'] }
    const requests: ExerciseRequest[] = [
      { mode: 'unit', category, difficulty, count: 10 },
      { mode: 'extra', count: 10 },
      { mode: 'review', stageId: 'example-stage' },
      { mode: 'mock' },
    ]
    const config: MockExamConfig = {
      id: 'test-only', revision: 1, title: 'テスト用の仮設定',
      delivery: 'webTesting', scope: 'nonverbal', provisional: true,
      timeLimitSeconds: 60, allocation: [{ category, difficulty, count: 1 }], notes: '型検査用',
    }
    const existing: ExistingProblem[] = generateUnitSet(category, difficulty, 10)
    const problems: SpiProblem[] = existing
    const extra: SpiProblem[] = generateExtraSet(10)
    const readConfig: MockExamConfig = getMockExamConfig()
    const mock: MockExamSet = generateMockSet()
    const timing: 'afterFinish' = mock.feedbackTiming
    const launcher: ExerciseLauncher = {
      onStart(request) {
        switch (request.mode) {
          case 'unit': generateUnitSet(request.category, request.difficulty, request.count); return
          case 'extra': generateExtraSet(request.count); return
          case 'review': { const id: string = request.stageId; return }
          case 'mock': generateMockSet(); return
          default: { const exhaustive: never = request; return exhaustive }
        }
      },
    }
    requests.forEach(launcher.onStart)
  `)
})

test('開始条件不足・未対応値・関数の引数と戻り値の不一致を拒否する', () => {
  check(`${imports}
    // @ts-expect-error 単元演習には難易度が必須
    const missingDifficulty: ExerciseRequest = { mode: 'unit', category: '割合', count: 10 }
    // @ts-expect-error エクストラに分野指定はない
    const filteredExtra: ExerciseRequest = { mode: 'extra', count: 10, category: '割合' }
    // @ts-expect-error 復習にはstageIdが必要
    const missingStage: ExerciseRequest = { mode: 'review' }
    // @ts-expect-error 未定義のモード
    const unknownMode: ExerciseRequest = { mode: 'practice' }
    // @ts-expect-error 問題数は文字列ではない
    const stringCount: ExerciseRequest = { mode: 'extra', count: '10' }
    // @ts-expect-error 未対応の分野
    const category: ProblemCategory = '言語'
    // @ts-expect-error 未対応の難易度
    const difficulty: Difficulty = 'expert'
    // @ts-expect-error 今回の模試はWEBテスティングのみ
    const delivery: MockExamConfig['delivery'] = 'paper'
    // @ts-expect-error 今回の模試は非言語のみ
    const scope: MockExamConfig['scope'] = 'verbal'
    // @ts-expect-error 暫定設定であることを明示する
    const provisional: MockExamConfig['provisional'] = false
    // @ts-expect-error 模試は終了後に解説を表示
    const timing: MockExamSet['feedbackTiming'] = 'afterEach'
    declare const generateUnitSet: GenerateUnitSet
    declare const generateExtraSet: GenerateExtraSet
    // @ts-expect-error 難易度・問題数が必要
    generateUnitSet('割合')
    // @ts-expect-error countはnumber
    generateExtraSet('10')
    declare const wrongResult: (count: number) => string[]
    // @ts-expect-error 戻り値はSpiProblem[]
    const wrongGenerator: GenerateExtraSet = wrongResult
  `)
})
