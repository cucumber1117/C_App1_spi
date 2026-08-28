import type { SpiProblem } from '../../features/problems/problemGenerator'

type QuestionProps = {
  problem: SpiProblem
  selectedAnswer: string | null
  onAnswer: (answer: string) => void
  onBack: () => void
  onSubmit: () => void
}

function Question({ problem, selectedAnswer, onAnswer, onBack, onSubmit }: QuestionProps) {
  return (
    <section className="page-content narrow-content question-page">
      <div className="question-topline">
        <button className="back-button" onClick={onBack} type="button">← 分野選択へ戻る</button>
        <span className="question-count">QUESTION 1 / 10</span>
      </div>
      <div className="progress-track"><span /></div>
      <div className="question-meta"><span>{problem.category}</span><span>難易度：{problem.difficulty}</span></div>
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
      <button className="primary-button submit-button" disabled={!selectedAnswer} onClick={onSubmit} type="button">回答する <span>→</span></button>
    </section>
  )
}

export default Question
