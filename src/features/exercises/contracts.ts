import type { Difficulty, ProblemCategory, SpiProblem } from '../problems/core'

export type { Difficulty, ProblemCategory, SpiProblem } from '../problems/core'

/**
 * 画面から親に渡す開始要求。既存のstages/learningのMode・Sessionとは別の契約。
 * 開始・採点・保存処理の実装や、既存の保存形式の変更はこのファイルでは行わない。
 */
export type ExerciseRequest =
  | { mode: 'unit'; category: ProblemCategory; difficulty: Difficulty; count: number }
  | { mode: 'extra'; count: number }
  | { mode: 'review'; stageId: string }
  | { mode: 'mock' }

/** UIは開始条件を通知するだけ。親側で生成・エラー表示・セッション開始を行う。 */
export type ExerciseLauncher = {
  onStart: (request: ExerciseRequest) => void
}

export type UnitView = {
  category: ProblemCategory
  description: string
  /** 対応ステージの有無など、単元全体の利用可否。個別の解放判定とは別。 */
  available: boolean
  stageIds: string[]
}

/** 非言語のみの暫定構成。本番SPIと同一の時間・配分を保証する設定ではない。 */
export type MockExamConfig = {
  id: string
  revision: number
  title: string
  delivery: 'webTesting'
  scope: 'nonverbal'
  provisional: true
  /** 実装側で正の整数（秒）であることを検証する。 */
  timeLimitSeconds: number
  /** 空配列を許さず、各countは正の整数。合計が試験の問題数になる。 */
  allocation: {
    category: ProblemCategory
    difficulty: Difficulty
    count: number
  }[]
  notes: string
}

export type MockExamSet = {
  id: string
  /** 生成時点の設定を深く複製する。設定変更を進行中の試験へ反映しない。 */
  config: MockExamConfig
  questions: SpiProblem[]
  feedbackTiming: 'afterFinish'
}

/**
 * 実装名: generateUnitSet
 * 指定した分野・難易度でcount問を生成する。
 * countの正の整数検証、同一内容の重複除外、上限付き再試行は実装側の責務。
 * 不正な入力・生成不能時はErrorを投げる。部分的な結果や空配列で成功を装わない。
 * 生成が完了するまで既存の学習状態を変更せず、採点・保存は行わない。
 */
export type GenerateUnitSet = (
  category: ProblemCategory,
  difficulty: Difficulty,
  count: number,
) => SpiProblem[]

/**
 * 実装名: generateExtraSet
 * 全対応分野から均等抽選し、次に全難易度から均等抽選して問題を生成する。
 * 1セットの配分が均等になる保証はない。検証・重複・エラーの扱いはGenerateUnitSetと同じ。
 */
export type GenerateExtraSet = (count: number) => SpiProblem[]

/** 実装名: getMockExamConfig。検証済みの暫定設定を返す。不正な設定はErrorにする。 */
export type GetMockExamConfig = () => MockExamConfig

/**
 * 実装名: generateMockSet
 * 暫定設定の配分に従って生成し、設定の複製と問題を返す。
 * 同一内容の重複を除外し、検証・生成失敗時はErrorを投げる。採点・保存・時計の開始は行わない。
 * 関数本体は模擬試験issueで実装する。この型定義は実行可能な関数を提供しない。
 */
export type GenerateMockSet = () => MockExamSet
