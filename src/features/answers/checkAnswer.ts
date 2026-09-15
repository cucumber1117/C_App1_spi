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
  // 古い履歴には選択肢・表が保存されていないため、読み込み時は省略を許します。
  choices?: string[]
  tables?: SpiProblem['tables']
  elapsedSeconds?: number
  answeredAt: string
}

/** 選択した回答を採点し、結果画面で使う情報を返します。 */
export const checkAnswer = (problem: Omit<SpiProblem, 'difficulty'>, selectedAnswer: string): AnswerResult => ({
  selectedAnswer,
  correctAnswer: problem.answer,
  isCorrect: selectedAnswer === problem.answer,
  explanation: problem.explanation,
})

/** 採点結果と出題時の内容を保存し、同じ問題を後で復習できるようにします。 */
export const createAnswerRecord = (problem: Omit<SpiProblem, 'difficulty'>, result: AnswerResult, elapsedSeconds: number): AnswerRecord => ({
  problemId: problem.id,
  category: problem.category,
  question: problem.question,
  choices: [...problem.choices],
  tables: problem.tables?.map((table) => ({
    title: table.title,
    headers: [...table.headers],
    rows: table.rows.map((row) => [...row]),
  })),
  ...result,
  elapsedSeconds,
  answeredAt: new Date().toISOString(),
})

/** 回答履歴のうち、間違えた問題だけを返します。 */
export const getIncorrectAnswers = (history: AnswerRecord[]): AnswerRecord[] => (
  history.filter((record) => !record.isCorrect)
)
