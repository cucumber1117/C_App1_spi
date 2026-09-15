import type { AnswerRecord } from './checkAnswer'

const ANSWER_HISTORY_KEY = 'spi-answer-history'

const isStringArray = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((item) => typeof item === 'string')
)

const isProblemTable = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false

  const table = value as Record<string, unknown>
  return typeof table.title === 'string'
    && isStringArray(table.headers)
    && Array.isArray(table.rows)
    && table.rows.every(isStringArray)
}

const isAnswerRecord = (value: unknown): value is AnswerRecord => {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>
  return typeof record.problemId === 'string'
    && typeof record.category === 'string'
    && typeof record.question === 'string'
    && typeof record.selectedAnswer === 'string'
    && typeof record.correctAnswer === 'string'
    && typeof record.isCorrect === 'boolean'
    && typeof record.explanation === 'string'
    && typeof record.answeredAt === 'string'
    && (record.choices === undefined || isStringArray(record.choices))
    && (record.tables === undefined || (Array.isArray(record.tables) && record.tables.every(isProblemTable)))
    && (record.elapsedSeconds === undefined || (typeof record.elapsedSeconds === 'number' && Number.isInteger(record.elapsedSeconds) && record.elapsedSeconds >= 0))
}

/** ブラウザに保存されている回答履歴を読み込みます。 */
export const loadAnswerHistory = (): AnswerRecord[] => {
  try {
    const savedHistory = localStorage.getItem(ANSWER_HISTORY_KEY)
    if (savedHistory === null) return []

    const parsedHistory: unknown = JSON.parse(savedHistory)
    if (!Array.isArray(parsedHistory)) return []

    return parsedHistory.filter(isAnswerRecord)
  } catch {
    return []
  }
}

/** 回答履歴をブラウザへ保存します。 */
export const saveAnswerHistory = (history: AnswerRecord[]): void => {
  try {
    localStorage.setItem(ANSWER_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // 保存できない環境でも、React上の履歴はそのまま利用できます。
  }
}
