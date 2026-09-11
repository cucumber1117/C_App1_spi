import type { AnswerRecord } from './checkAnswer'

const ANSWER_HISTORY_KEY = 'spi-answer-history'

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
