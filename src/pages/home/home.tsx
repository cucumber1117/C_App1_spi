type HomeProps = {
  onStart: () => void
}

function Home({ onStart }: HomeProps) {
  return (
    <section className="home-page page-content">
      <div className="hero-copy">
        <p className="eyebrow">SPI TRAINING</p>
        <h1>すきま時間で、<br /><span>得点力</span>を伸ばそう。</h1>
        <p className="lead">SPI非言語問題を解いて、就活に向けた力を身につけよう。</p>
        <button className="primary-button" onClick={onStart} type="button">問題をはじめる <span>→</span></button>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="visual-card"><span className="visual-check">✓</span><strong>今日も一問、<br />積み重ねよう</strong><small>YOUR NEXT STEP</small></div>
      </div>
      <div className="feature-row"><div><strong>3</strong><span>分野から出題</span></div><div><strong>∞</strong><span>問題をランダム生成</span></div><div><strong>1</strong><span>問ずつ着実に</span></div></div>
    </section>
  )
}

export default Home
