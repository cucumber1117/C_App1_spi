import type { ProblemCategory, SpiProblem } from '../problems/problemGenerator'

export type AnswerResult = {
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

export type AnswerRecord = AnswerResult & {
  problemId: string
  category: ProblemCategory
  question: string
  answeredAt: string
}

/** 選択した回答を採点し、結果画面で使う情報を返します。 */
export const checkAnswer = (problem: SpiProblem, selectedAnswer: string): AnswerResult => ({
  selectedAnswer,
  correctAnswer: problem.answer,
  isCorrect: selectedAnswer === problem.answer,
  explanation: problem.explanation,
})

/** 採点結果に問題情報と回答日時を加えて、履歴用のデータを作ります。 */
export const createAnswerRecord = (problem: SpiProblem, result: AnswerResult): AnswerRecord => ({
  problemId: problem.id,
  category: problem.category,
  question: problem.question,
  ...result,
  answeredAt: new Date().toISOString(),
})

/** 回答履歴のうち、間違えた問題だけを返します。 */
export const getIncorrectAnswers = (history: AnswerRecord[]): AnswerRecord[] => (
  history.filter((record) => !record.isCorrect)
)
