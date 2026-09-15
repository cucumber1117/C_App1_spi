export type Difficulty = 'easy' | 'normal' | 'hard'
export type ProblemCategory = '推論' | '場合の数' | '確率' | '集合' | '損益算' | '速度算' | '割合' | '表の読み取り'
export type Table = { title: string; headers: string[]; rows: string[][] }
export type SpiProblem = {
  id: string
  category: ProblemCategory
  question: string
  choices: string[]
  answer: string
  explanation: string
  difficulty: Difficulty
  tables?: Table[]
  patternId?: string
}
export type Draft = Omit<SpiProblem, 'id' | 'category' | 'difficulty' | 'patternId'>
export type Template = {
  id: string
  category: ProblemCategory
  name: string
  difficulty: Difficulty
  create: () => Draft
}

export const int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = int(0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)]
export const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)
export const factorial = (n: number): number => n < 2 ? 1 : n * factorial(n - 1)
export const choose = (n: number, k: number): number => k < 0 || k > n ? 0 : Math.round(factorial(n) / factorial(k) / factorial(n - k))
export function permutations<T>(items: T[]): T[][] {
  return items.length ? items.flatMap((x, i) => permutations(items.filter((_, j) => j !== i)).map(rest => [x, ...rest])) : [[]]
}
export function fraction(n: number, d: number): string {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d <= 0) throw new Error('分数の入力が不正です')
  let a = Math.abs(n), b = d
  while (b) [a, b] = [b, a % b]
  return d / a === 1 ? String(n / a) : `${n / a}/${d / a}`
}
export function textQuestion(question: string, answer: string, wrong: string[], explanation: string, tables?: Table[]): Draft {
  const candidates = shuffle([...new Set(wrong)].filter(x => x !== answer)).slice(0, 3)
  if (candidates.length !== 3) throw new Error('異なる誤答が3つ必要です')
  return { question, answer, choices: shuffle([answer, ...candidates]), explanation, ...(tables ? { tables } : {}) }
}
/** 小数が必要な問題は呼び出し側で丸め方を明記する。整数単位はここで検査する。 */
export function numeric(question: string, value: number, unit: string, explanation: string, tables?: Table[], wrong: number[] = []): Draft {
  if (!Number.isFinite(value) || value < 0) throw new Error('答えが不正です')
  const rounded = Math.round(value * 100) / 100
  if (['人', '個', '通り', '円', '枚', '件'].includes(unit) && Math.abs(value - Math.round(value)) > 1e-8) throw new Error('離散量は整数で生成してください')
  const step = Number.isInteger(rounded) ? Math.max(1, Math.round(rounded / 10)) : 0.1
  const candidates = [...wrong, ...[-3, -2, -1, 1, 2, 3, 4].map(k => rounded + step * k)]
    .filter(x => x >= 0 && (!['人', '個', '通り', '円', '枚', '件'].includes(unit) || Number.isInteger(x)))
    .map(x => `${Math.round(x * 100) / 100}${unit}`)
  return textQuestion(question, `${rounded}${unit}`, candidates, explanation, tables)
}
export function probability(question: string, favorable: number, total: number, explanation: string): Draft {
  if (favorable <= 0 || favorable >= total) throw new Error('確率の範囲が不正です')
  const wrong = Array.from({ length: total - 1 }, (_, i) => fraction(i + 1, total))
  return textQuestion(question, fraction(favorable, total), wrong, `${explanation} よって ${favorable}/${total} = ${fraction(favorable, total)}。`)
}
export function validateProblem(p: SpiProblem): void {
  if (!p.question || !p.explanation || p.choices.length !== 4 || new Set(p.choices).size !== 4 || p.choices.filter(x => x === p.answer).length !== 1) throw new Error('問題データが不正です')
  for (const t of p.tables ?? []) {
    if (!t.title || t.headers.length < 2 || !t.rows.length || t.rows.some(row => row.length !== t.headers.length)) throw new Error('表の列数が不正です')
  }
}
