import type { AnswerRecord } from './checkAnswer'
import { PROBLEM_CATEGORIES, type ProblemCategory } from '../problems/problemGenerator'

export type ScoreSummary = {
  totalCount: number
  correctCount: number
  incorrectCount: number
  accuracy: number
}

export type CategoryScoreSummary = ScoreSummary & {
  category: ProblemCategory
}

/** 回答履歴から、回答数・正解数・不正解数・正答率を計算します。 */
export const calculateScoreSummary = (history: AnswerRecord[]): ScoreSummary => {
  const totalCount = history.length
  const correctCount = history.filter((record) => record.isCorrect).length
  const incorrectCount = totalCount - correctCount
  const accuracy = totalCount === 0
    ? 0
    : Math.round((correctCount / totalCount) * 100)

  return {
    totalCount,
    correctCount,
    incorrectCount,
    accuracy,
  }
}

/** 回答履歴を分野ごとに分けて、それぞれの成績を計算します。 */
export const calculateCategoryScoreSummaries = (history: AnswerRecord[]): CategoryScoreSummary[] => (
  PROBLEM_CATEGORIES.map((category) => ({
    category,
    ...calculateScoreSummary(history.filter((record) => record.category === category)),
  }))
)
