export type ProblemDifficulty = 'easy' | 'normal' | 'hard'

export type SpiProblem = {
  id: string
  category: string
  question: string
  choices: string[]
  answer: string
  explanation: string
  difficulty: ProblemDifficulty
}

/** SPI形式のオリジナル練習問題。問題生成ロジックとは分離した固定問題集です。 */
export const collectedProblems: SpiProblem[] = [
  {
    id: 'percentage-001', category: '割合', difficulty: 'easy',
    question: '240人の15%は何人ですか。', choices: ['24人', '36人', '42人', '48人'], answer: '36人',
    explanation: '240 × 15 ÷ 100 = 36人です。',
  },
  {
    id: 'percentage-002', category: '割合', difficulty: 'easy',
    question: 'ある数の25%が18のとき、ある数はいくつですか。', choices: ['54', '64', '72', '90'], answer: '72',
    explanation: '18 ÷ 25 × 100 = 72です。',
  },
  {
    id: 'percentage-003', category: '割合', difficulty: 'normal',
    question: '定価800円の商品を20%引きで買うと、いくらですか。', choices: ['600円', '640円', '680円', '720円'], answer: '640円',
    explanation: '800 × (1 - 20 ÷ 100) = 640円です。',
  },
  {
    id: 'percentage-004', category: '割合', difficulty: 'normal',
    question: '昨年の売上が500万円で、今年は12%増加しました。今年の売上はいくらですか。', choices: ['540万円', '550万円', '560万円', '620万円'], answer: '560万円',
    explanation: '500 × (1 + 12 ÷ 100) = 560万円です。',
  },
  {
    id: 'percentage-005', category: '割合', difficulty: 'hard',
    question: 'ある商品を30%値上げした後、値上げ後の価格から30%値下げしました。元の価格と比べて何%変化しましたか。', choices: ['変化なし', '3%値下がり', '9%値下がり', '9%値上がり'], answer: '9%値下がり',
    explanation: '元の価格を100とすると、100 × 1.3 × 0.7 = 91です。元より9%下がります。',
  },
  {
    id: 'profit-loss-001', category: '損益算', difficulty: 'easy',
    question: '原価600円の商品に、原価の25%の利益を加えました。売価はいくらですか。', choices: ['700円', '750円', '800円', '825円'], answer: '750円',
    explanation: '600 × (1 + 25 ÷ 100) = 750円です。',
  },
  {
    id: 'profit-loss-002', category: '損益算', difficulty: 'easy',
    question: '900円で仕入れた商品を1,080円で売りました。原価に対する利益率は何%ですか。', choices: ['15%', '20%', '25%', '30%'], answer: '20%',
    explanation: '利益は180円なので、180 ÷ 900 × 100 = 20%です。',
  },
  {
    id: 'profit-loss-003', category: '損益算', difficulty: 'normal',
    question: '原価1,200円の商品を、20%の利益を見込んで定価をつけました。定価はいくらですか。', choices: ['1,400円', '1,440円', '1,480円', '1,500円'], answer: '1,440円',
    explanation: '1,200 × (1 + 20 ÷ 100) = 1,440円です。',
  },
  {
    id: 'profit-loss-004', category: '損益算', difficulty: 'normal',
    question: '定価2,500円の商品を定価の20%引きで売っても、原価の25%の利益が出ました。原価はいくらですか。', choices: ['1,400円', '1,500円', '1,600円', '1,800円'], answer: '1,600円',
    explanation: '売価は2,500 × 0.8 = 2,000円です。原価は2,000 ÷ 1.25 = 1,600円です。',
  },
  {
    id: 'profit-loss-005', category: '損益算', difficulty: 'hard',
    question: '原価に40%の利益を加えた定価から、定価の10%を値引きして販売しました。原価に対する利益率は何%ですか。', choices: ['20%', '24%', '26%', '30%'], answer: '26%',
    explanation: '原価を100とすると、売価は100 × 1.4 × 0.9 = 126。利益率は26%です。',
  },
  {
    id: 'speed-001', category: '速度算', difficulty: 'easy',
    question: '時速60kmで2時間進むと、何km進みますか。', choices: ['30km', '100km', '120km', '180km'], answer: '120km',
    explanation: '道のり = 速さ × 時間なので、60 × 2 = 120kmです。',
  },
  {
    id: 'speed-002', category: '速度算', difficulty: 'easy',
    question: '150kmの道のりを時速50kmで進むと、何時間かかりますか。', choices: ['2時間', '3時間', '4時間', '5時間'], answer: '3時間',
    explanation: '時間 = 道のり ÷ 速さなので、150 ÷ 50 = 3時間です。',
  },
  {
    id: 'speed-003', category: '速度算', difficulty: 'normal',
    question: '分速80mで15分歩くと、何m進みますか。', choices: ['800m', '1,000m', '1,200m', '1,500m'], answer: '1,200m',
    explanation: '道のり = 80 × 15 = 1,200mです。',
  },
  {
    id: 'speed-004', category: '速度算', difficulty: 'normal',
    question: '行きは時速40km、帰りは時速60kmで同じ道を走りました。往復に5時間かかったとき、片道の道のりは何kmですか。', choices: ['80km', '100km', '120km', '150km'], answer: '120km',
    explanation: '片道をx kmとすると、x÷40 + x÷60 = 5。x(1/40 + 1/60) = 5より、x = 120kmです。',
  },
  {
    id: 'speed-005', category: '速度算', difficulty: 'hard',
    question: '長さ120mの列車が、長さ180mのトンネルを時速72kmで完全に通過するのに何秒かかりますか。', choices: ['10秒', '12秒', '15秒', '18秒'], answer: '15秒',
    explanation: '進む距離は120 + 180 = 300m。時速72kmは毎秒20mなので、300 ÷ 20 = 15秒です。',
  },
]

export const getProblemsByCategory = (category: string) =>
  collectedProblems.filter((problem) => problem.category === category)

export const getProblemsByDifficulty = (difficulty: ProblemDifficulty) =>
  collectedProblems.filter((problem) => problem.difficulty === difficulty)
