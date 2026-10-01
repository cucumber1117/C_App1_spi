type HomeProps = {
  started: boolean
  onContinue: () => void
  onMap: () => void
  onReview: () => void
  onPerformance: () => void
}
export default function Home({ started, onContinue, onMap, onReview, onPerformance }: HomeProps) {
  return <section className="page-content learning-home">
    <p className="eyebrow">SPI TRAINING</p>
    <h1>{started ? <>今日も、<br />ひとつ先へ。</> : <>どちらから<br />始める？</>}</h1>
    <p className="lead">自分のペースで、少しずつ。</p>
    {started && <button className="primary-button continue-button" type="button" onClick={onContinue}>続きから →</button>}
    <div className="home-actions">
      <button className="secondary-button" type="button" disabled>言語（準備中）</button>
      <button className={started ? 'secondary-button' : 'primary-button'} type="button" onClick={onMap}>非言語 →</button>
      <button className="secondary-button" type="button" onClick={onReview}>復習</button>
    </div>
    <button className="quiet-link" type="button" onClick={onPerformance}>成績を見る</button>
  </section>
}
