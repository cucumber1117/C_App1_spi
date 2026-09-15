import { pick, validateProblem } from './core'
import type { Difficulty, ProblemCategory, SpiProblem } from './core'
import { templates } from './templates'

export type { Difficulty, ProblemCategory, SpiProblem } from './core'

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  '推論', '場合の数', '確率', '集合', '損益算', '速度算', '割合', '表の読み取り',
]

/** UIを変更せず、開発用の問題確認や連携時に参照できる出題一覧。 */
export const PROBLEM_PATTERNS = templates.map(({ id, category, name, difficulty }) => ({ id, category, name, difficulty }))

export function generateProblemByPattern(patternId: string): SpiProblem {
  const template = templates.find(t => t.id === patternId)
  if (!template) throw new RangeError(`不明な出題パターン: ${patternId}`)
  const problem: SpiProblem = {
    ...template.create(),
    id: globalThis.crypto.randomUUID(),
    category: template.category,
    difficulty: template.difficulty,
    patternId: template.id,
  }
  validateProblem(problem)
  return problem
}

/** 難易度は数値だけでなく、出題する解法・条件の複雑さで切り替える。 */
export function generateProblem(category?: ProblemCategory, difficulty: Difficulty = 'normal'): SpiProblem {
  const selectedCategory = category ?? pick(PROBLEM_CATEGORIES)
  const candidates = templates.filter(t => t.category === selectedCategory && t.difficulty === difficulty)
  if (!candidates.length) throw new RangeError(`対応していない分野・難易度: ${selectedCategory}/${difficulty}`)
  return generateProblemByPattern(pick(candidates).id)
}

export function generateProblems(count: number, options: { category?: ProblemCategory; difficulty?: Difficulty } = {}): SpiProblem[] {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('問題数には0以上の整数を指定してください')
  return Array.from({ length: count }, () => generateProblem(options.category, options.difficulty))
}
