import type { ReviewableAnswerRecord } from '../../features/answers/reviewProblems'

type ReviewProps = {
  problems: ReviewableAnswerRecord[]
  onSelect: (problem: ReviewableAnswerRecord) => void
  onBack: () => void
}

function Review({ problems, onSelect, onBack }: ReviewProps) {
  return (
    <section className="page-content narrow-content">
      <button className="back-button" onClick={onBack} type="button">← ホームへ戻る</button>
      <p className="eyebrow">REVIEW</p>
      <h2 className="page-title">間違えた問題を復習</h2>
      <p className="page-description">もう一度解きたい問題を選んでください。正解すると、この一覧から外れます。</p>

      {problems.length === 0 ? (
        <div className="result-card">
          <strong>復習する問題はありません</strong>
          <p>間違えた問題があると、ここに表示されます。</p>
        </div>
      ) : (
        <div className="category-grid">
          {problems.map((problem) => (
            <button className="category-card" key={problem.problemId} onClick={() => onSelect(problem)} type="button">
              <span className="category-info">
                <strong>{problem.category}</strong>
                <small className="review-question">{problem.question}</small>
              </span>
              <span className="card-arrow">→</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default Review
