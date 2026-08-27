type QuestionProps = {
  category: string
  selectedAnswer: string | null
  onAnswer: (answer: string) => void
  onBack: () => void
  onSubmit: () => void
}

const choices = ['20人', '25人', '30人', '35人']

function Question({ category, selectedAnswer, onAnswer, onBack, onSubmit }: QuestionProps) {
  return (
    <section className="page-content narrow-content question-page">
      <div className="question-topline">
        <button className="back-button" onClick={onBack} type="button">← 分野選択へ戻る</button>
        <span className="question-count">QUESTION 1 / 10</span>
      </div>
      <div className="progress-track"><span /></div>
      <div className="question-meta"><span>{category}</span><span>難易度：標準</span></div>
      <div className="question-card">
        <p className="question-label">問題文</p>
        <h2>120人の25%は何人ですか。</h2>
        <div className="choices">
          {choices.map((choice, index) => (
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
