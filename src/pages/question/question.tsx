import { useEffect, useRef, useState } from 'react'
import type { Difficulty, SpiProblem } from '../../features/problems/problemGenerator'

type QuestionProblem = Omit<SpiProblem, 'difficulty'> & { difficulty?: Difficulty }

type QuestionProps = {
  problem: QuestionProblem
  selectedAnswer: string | null
  onAnswer: (answer: string) => void
  onBack: () => void
  onSubmit: (elapsedSeconds: number) => void
  isReview?: boolean
}

const formatElapsedTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function Question({ problem, selectedAnswer, onAnswer, onBack, onSubmit, isReview = false }: QuestionProps) {
  const startedAt = useRef<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    startedAt.current = performance.now()
    const intervalId = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsedSeconds(Math.floor((performance.now() - startedAt.current) / 1000))
      }
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [])

  const submitWithTime = () => {
    const finalSeconds = startedAt.current === null
      ? 0
      : Math.floor((performance.now() - startedAt.current) / 1000)
    onSubmit(finalSeconds)
  }

  return (
    <section className="page-content narrow-content question-page">
      <div className="question-topline">
        <button className="back-button" onClick={onBack} type="button">← {isReview ? '復習一覧へ戻る' : '分野選択へ戻る'}</button>
        <div className="question-status">
          <span className="question-count">{isReview ? 'REVIEW' : 'QUESTION 1 / 10'}</span>
          <span className="question-timer">経過時間 {formatElapsedTime(elapsedSeconds)}</span>
        </div>
      </div>
      <div className="progress-track"><span /></div>
      <div className="question-meta"><span>{problem.category}</span>{problem.difficulty && <span>難易度：{problem.difficulty}</span>}</div>
      <div className="question-card">
        <p className="question-label">問題文</p>
        <h2>{problem.question}</h2>
        {problem.tables?.map((table) => <div className="problem-table-wrap" key={table.title}><p className="problem-table-title">{table.title}</p><table className="problem-table"><thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>)}
        <div className="choices">
          {problem.choices.map((choice, index) => (
            <button className={`choice-button ${selectedAnswer === choice ? 'is-selected' : ''}`} key={choice} onClick={() => onAnswer(choice)} type="button">
              <span>{String.fromCharCode(65 + index)}</span>{choice}
            </button>
          ))}
        </div>
      </div>
      <button className="primary-button submit-button" disabled={!selectedAnswer} onClick={submitWithTime} type="button">回答する <span>→</span></button>
    </section>
  )
}

export default Question
