import type { AnswerRecord } from './checkAnswer'
import type { SpiProblem } from '../problems/problemGenerator'

export type ReviewableAnswerRecord = AnswerRecord & { choices: string[] }
export type ReviewProblem = Omit<SpiProblem, 'difficulty'>

/** 古い履歴など、同じ問題を再出題できない記録を除外します。 */
const isReviewable = (record: AnswerRecord): record is ReviewableAnswerRecord => (
  Array.isArray(record.choices)
  && record.choices.length === 4
  && new Set(record.choices).size === 4
  && record.choices.includes(record.correctAnswer)
  && (record.category !== '表の読み取り' || (record.tables?.length ?? 0) > 0)
)

/** 問題IDごとの最新回答が不正解の問題だけを、復習対象として返します。 */
export const getReviewProblems = (history: AnswerRecord[]): ReviewableAnswerRecord[] => {
  const latestByProblemId = new Map<string, AnswerRecord>()

  for (const record of history) {
    latestByProblemId.set(record.problemId, record)
  }

  return history.filter((record): record is ReviewableAnswerRecord => (
    latestByProblemId.get(record.problemId) === record
    && !record.isCorrect
    && isReviewable(record)
  ))
}

/** 保存された問題の内容を、再回答に使う問題データへ戻します。 */
export const toReviewProblem = (record: ReviewableAnswerRecord): ReviewProblem => ({
  id: record.problemId,
  category: record.category,
  question: record.question,
  choices: [...record.choices],
  answer: record.correctAnswer,
  explanation: record.explanation,
  tables: record.tables?.map((table) => ({
    title: table.title,
    headers: [...table.headers],
    rows: table.rows.map((row) => [...row]),
  })),
})
