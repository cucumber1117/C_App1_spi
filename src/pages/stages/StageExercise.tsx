import { useEffect, useRef } from 'react'
import type { Session } from '../../features/stages/learning'
import { sessionScore } from '../../features/stages/learning'
import { stageTitle } from '../../features/stages/catalog'
import type { Ink } from '../../features/stages/ink'
import type { SpiProblem } from '../../features/problems/problemGenerator'
import InkMemo, { InkPreview } from './InkMemo'
import './exercise.css'

type Props = {
  session: Session; inReview: boolean; saveError: string | null
  onSelect: (answer: string) => void; onSubmit: (elapsed: number) => void; onAdvance: () => void
  onFeedback: (open: boolean) => void; onInk: (ink: Ink) => void; onNote: (note: string) => void
  onExit: () => void; onNext: () => void; onRetry: () => void; onAddReview: () => void
}
function Tables({ problem }: { problem: SpiProblem }) {
  return <>{problem.tables?.map((table, index) => <div className="problem-table-wrap" key={index}>
    <p className="problem-table-title">{table.title}</p><table className="problem-table">
      <thead><tr>{table.headers.map((cell, i) => <th key={i}>{cell}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>)}</>
}
export default function StageExercise(props: Props) {
  const { session: s } = props
  const heading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDialogElement>(null)
  const startedAt = useRef(0)
  const q = s.questions[s.index]
  const answered = s.answers[s.index] !== null
  const finished = s.phase === 'result'
  const showFeedback = s.phase === 'feedback' && s.feedbackOpen
  const score = sessionScore(s)
  useEffect(() => {
    startedAt.current = performance.now()
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [s.id, s.index, finished])
  useEffect(() => {
    const dialog = feedback.current
    if (!showFeedback || !dialog) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = overflow }
  }, [showFeedback, s.index])
  return <section className="stage-exercise" data-memo-surface>
    <div className="exercise-top"><button type="button" onClick={props.onExit}>閉じる</button><span>{s.mode === 'review' ? '復習 · ' : ''}{stageTitle(s.plan)}</span><span>{finished ? 'RESULT' : `${s.index + 1} / 10`}</span></div>
    {!finished ? <>
      {s.mode === 'review' && <p className="exercise-unit">{q.category}</p>}
      <progress aria-label="回答済みの問題数" max={10} value={s.answers.filter(a => a !== null).length} />
      <InkMemo key={`${s.id}-${s.index}`} ink={s.ink[s.index] ?? undefined} onChange={props.onInk} />
      <h1 ref={heading} tabIndex={-1} className="exercise-question">{q.question}</h1>
      <Tables problem={q} />
      <div className="exercise-choices" role="group" aria-label="選択肢">
        {q.choices.map((choice, i) => <button key={choice} type="button" disabled={answered} aria-pressed={s.selected === choice}
          className={`${s.selected === choice ? 'exercise-selected' : ''} ${answered && choice === q.answer ? 'exercise-correct' : ''}`}
          onClick={() => props.onSelect(choice)}><span>{String.fromCharCode(65 + i)}</span>{choice}{answered && choice === q.answer && <small>正解</small>}</button>)}
      </div>
      <details className="exercise-memo"><summary>文字メモ</summary><textarea aria-label="この問題のメモ" placeholder="計算や気づきを残す" value={s.notes[s.index]} onChange={e => props.onNote(e.target.value)} /></details>
      {showFeedback && <dialog ref={feedback} className="exercise-feedback-sheet" aria-labelledby="exercise-feedback-title" aria-describedby="exercise-feedback-explanation" onCancel={() => props.onFeedback(false)}>
        <div className="exercise-feedback-body">{props.saveError && <p role="alert">保存できませんでした。問題を見返すボタンで戻り、保存を再試行してください。</p>}<h2 id="exercise-feedback-title">{s.answers[s.index] === q.answer ? '正解！' : '答えを確認しよう'}</h2><p className="exercise-answer">正解：{q.answer}</p><p id="exercise-feedback-explanation">{q.explanation}</p></div>
        <div className="exercise-feedback-actions"><button type="button" className="exercise-feedback-next" autoFocus onClick={props.onAdvance}>{s.index === 9 ? '結果を見る' : '次の問題へ'} →</button><button type="button" className="exercise-feedback-back" onClick={() => props.onFeedback(false)}>問題を見返す</button></div>
      </dialog>}
      <div className="exercise-action">{answered ? <button type="button" onClick={() => props.onFeedback(true)}>解説を見る</button>
        : <button type="button" disabled={s.selected === null} onClick={() => props.onSubmit(Math.max(0, Math.floor((performance.now() - startedAt.current) / 1000)))}>回答する</button>}</div>
      <p className="exercise-save">{props.saveError ? '保存に失敗しています。画面を閉じる前に再試行してください。' : '自動保存 · 閉じても続きから再開できます。'}</p>
    </> : <section className="exercise-result"><p>おつかれさま！</p><h1 ref={heading} tabIndex={-1}>{score === 10 ? 'PERFECT!' : score >= 6 ? 'CLEAR' : '最後までできました'}</h1><p className="exercise-score">{score}<span> / 10</span></p>
      {s.mode === 'review' ? <p>{score >= 7 ? '復習をひとつ終えました。' : 'また取り組めるよう、復習に残しました。'}</p> : props.inReview && <p>復習の候補にしました。</p>}
      <div className="exercise-action"><button type="button" onClick={props.onNext}>次へ →</button></div>
      {s.mode === 'practice' && score >= 7 && score <= 9 && !props.inReview && <button className="exercise-link" type="button" onClick={props.onAddReview}>＋ 復習に追加</button>}
      <details className="exercise-review"><summary>今回の問題を振り返る</summary>{s.questions.map((question, i) => <article key={question.id}>
        <h2>{i + 1}. {question.question}</h2><Tables problem={question} /><p>あなたの回答：{s.answers[i]}</p><p>正解：{question.answer}</p><p>{question.explanation}</p>
        {s.notes[i] && <p>メモ：{s.notes[i]}</p>}{s.ink[i]?.strokes.length ? <InkPreview ink={s.ink[i]!} /> : null}
      </article>)}</details>
      {(s.mode === 'practice' || props.inReview) && <button type="button" className="exercise-link" onClick={props.onRetry}>もう一度挑戦する</button>}
    </section>}
  </section>
}
