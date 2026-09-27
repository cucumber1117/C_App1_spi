import { PROBLEM_CATEGORIES, type ProblemCategory } from './problemGenerator'
import type { AnswerRecord } from '../answers/checkAnswer'

/** MAPも出題と同じ分野一覧を使用する。履歴は既存の回答保存に一本化する。 */
export function getCategoryStages(history: AnswerRecord[]) {
  return PROBLEM_CATEGORIES.map((category, index) => ({
    id: category,
    label: String(index + 1).padStart(2, '0'),
    category,
    played: history.some(record => record.category === category),
    award: history.some(record => record.category === category && record.isCorrect)
      ? 'clear' as const : undefined,
  }))
}

export function categoryForStage(stageId: string): ProblemCategory | undefined {
  return PROBLEM_CATEGORIES.find(category => category === stageId)
}
