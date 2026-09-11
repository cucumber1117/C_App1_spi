import type { CategoryScoreSummary, ScoreSummary } from '../../features/answers/scoreCalculator'

type PerformanceProps = {
  scoreSummary: ScoreSummary
  categoryScoreSummaries: CategoryScoreSummary[]
  onBack: () => void
}

function Performance({ scoreSummary, categoryScoreSummaries, onBack }: PerformanceProps) {
  return (
    <section className="page-content narrow-content">
      <button className="back-button" onClick={onBack} type="button">← ホームへ戻る</button>
      <p className="eyebrow">PERFORMANCE</p>
      <h2 className="page-title">成績</h2>
      <p className="page-description">これまでに回答した問題の成績です。</p>

      {scoreSummary.totalCount === 0 ? (
        <div className="result-card">
          <strong>まだ成績がありません</strong>
          <p>問題に挑戦すると、ここに成績が表示されます。</p>
        </div>
      ) : (
        <>
          <div className="result-card">
            <strong>全体成績</strong>
            <p>回答数：{scoreSummary.totalCount}問</p>
            <p>正解：{scoreSummary.correctCount}問 ／ 不正解：{scoreSummary.incorrectCount}問</p>
            <p>正答率：{scoreSummary.accuracy}%</p>
          </div>

          <h3>分野別成績</h3>
          <div className="category-grid">
            {categoryScoreSummaries.map((summary) => (
              <div className="category-card" key={summary.category}>
                <span className="category-info">
                  <strong>{summary.category}</strong>
                  <small>{summary.correctCount}/{summary.totalCount}問正解</small>
                </span>
                <strong className="card-arrow">{summary.accuracy}%</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Performance
