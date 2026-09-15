import { choose, factorial, int, numeric, permutations, pick, probability, shuffle, textQuestion } from './core'
import type { Template } from './core'

// 参考資料の文章・固有の設定・表を転記せず、一般的な解法から独自に構成する。
export const templates: Template[] = [
  {
    id: 'inference-schedule', category: '推論', name: '先後関係と位置の可能性', difficulty: 'easy',
    create: () => {
      const [a, b, c, d, e] = shuffle(['検品', '撮影', '梱包', '記録', '発送'])
      const gap = int(1, 2)
      const valid = permutations([a, b, c, d, e]).filter(p => p.indexOf(b) > p.indexOf(a) && p.indexOf(c) === p.indexOf(a) + gap + 1 && p.indexOf(d) < p.indexOf(e))
      const positions = [...new Set(valid.map(p => p.indexOf(b) + 1))].sort()
      return textQuestion(`5つの作業「${a}・${b}・${c}・${d}・${e}」を1つずつ順に行います。${b}は${a}より後、${a}と${c}の間にはちょうど${gap}つの作業があり、${a}の方が先です。また、${d}は${e}より先です。${b}を行える位置をすべて挙げたものはどれですか。`, positions.join('・') + '番目', ['1・2番目', '1・3・5番目', '2・3番目', '4番目のみ'], `${b}の前には${a}が必要なので1番目にはできません。残る位置について条件を満たす並びを作ると、${positions.map(pos => `${pos}番目の例：${valid.find(order => order.indexOf(b) + 1 === pos)!.join('→')}`).join('。')}。したがって${positions.join('・')}番目が可能です。なお、全条件を満たす並びは${valid.length}通りあります。`)
    },
  },
  {
    id: 'inference-allocation', category: '推論', name: '整数条件と最大値', difficulty: 'normal',
    create: () => {
      const total = int(16, 28), diff = int(2, 5)
      const candidates: number[][] = []
      for (let a = 1; a <= total; a++) for (let c = 1; c <= total; c++) {
        const b = a - diff
        if (b >= 1 && c < b && a + b + c === total) candidates.push([a, b, c])
      }
      const answer = Math.max(...candidates.map(x => x[2]))
      return numeric(`A・B・Cの3つの棚に、合計${total}個の箱を置きました。各棚には1個以上あり、AはBより${diff}個多く、CはBより少ないことが分かっています。Cの箱は最大で何個ですか。`, answer, '個', `Bをb個とするとAはb+${diff}個、Cは${total - diff}−2b個です。Cが1以上かつb未満となる整数を調べると、Cの最大値は${answer}個です。このとき（A,B,C）=（${candidates.find(x => x[2] === answer)!.join(',')}）。`)
    },
  },
  {
    id: 'inference-sufficiency', category: '推論', name: '追加情報の十分性', difficulty: 'hard',
    create: () => {
      const total = pick([18, 22, 26]), diff = pick([2, 6]), mode = int(0, 3)
      const a = (total + diff) / 2
      const infoA = mode === 0 || mode === 3 ? `AはBより${diff}個多い` : 'AはBより多い'
      const infoB = mode === 1 || mode === 3 ? `Bは${total - a}個である` : 'Bは偶数個である'
      const possible = Array.from({ length: total - 1 }, (_, i) => i + 1)
      const left = possible.filter(x => mode === 0 || mode === 3 ? x - (total - x) === diff : x > total - x)
      const right = possible.filter(x => mode === 1 || mode === 3 ? total - x === total - a : (total - x) % 2 === 0)
      const both = left.filter(x => right.includes(x))
      const options = ['アだけで分かるが、イだけでは分からない', 'イだけで分かるが、アだけでは分からない', 'アだけでもイだけでも分かる', '両方合わせれば分かるが、片方だけでは分からない', '両方合わせても分からない']
      // totalとdiffをともに4で割って2余る数にし、Bの偶数条件と整合させる。
      const answer = left.length === 1 ? right.length === 1 ? options[2] : options[0] : right.length === 1 ? options[1] : both.length === 1 ? options[3] : options[4]
      return textQuestion(`AとBの2箱に部品が合計${total}個あり、どちらも1個以上です。Aの個数を特定できるか考えてください。\nア：${infoA}。\nイ：${infoB}。`, answer, options.filter(x => x !== answer), `Aの候補数はアだけで${left.length}通り、イだけで${right.length}通り、両方で${both.length}通りです。候補が1つになる情報で特定できます。`)
    },
  },
  {
    id: 'cases-selection', category: '場合の数', name: '少なくとも1つを含む選び方', difficulty: 'easy',
    create: () => {
      const a = int(3, 6), b = int(4, 7)
      return numeric(`互いに異なる企画案が、屋内向け${a}件、屋外向け${b}件あります。この中から3件を採用するとき、屋内向けを少なくとも1件含む選び方は何通りですか。採用順は区別しません。`, choose(a + b, 3) - choose(b, 3), '通り', `全体の選び方から屋外向けだけの選び方を引きます。${a + b}C3 − ${b}C3 = ${choose(a + b, 3) - choose(b, 3)}通り。`)
    },
  },
  {
    id: 'cases-separation', category: '場合の数', name: '隣り合わない並べ方', difficulty: 'normal',
    create: () => {
      const n = int(5, 7)
      return numeric(`異なる${n}枚の展示パネルを横一列に並べます。そのうち指定された2枚は、互いに隣り合わないようにします。並べ方は何通りですか。左右を逆にした並びは別とします。`, factorial(n) - 2 * factorial(n - 1), '通り', `すべての並びは${n}!通り。指定2枚が隣り合う並びは、2枚を1組とみて2×${n - 1}!通りなので、差は${factorial(n) - 2 * factorial(n - 1)}通りです。`)
    },
  },
  {
    id: 'cases-digits', category: '場合の数', name: 'ゼロと倍数条件を含む整数', difficulty: 'hard',
    create: () => {
      const digits = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4)].sort((a, b) => a - b)
      const values = permutations(digits).map(p => p.slice(0, 3)).filter(p => p[0] !== 0 && (100 * p[0] + 10 * p[1] + p[2]) % 3 === 0)
      const unique = [...new Set(values.map(p => p.join('')))]
      return numeric(`数字${digits.join('、')}が書かれたカードが1枚ずつあります。3枚を選んで並べ、3桁の3の倍数を作る方法は何通りですか。百の位を0にはできません。`, unique.length, '通り', `選んだ3数字の和が3の倍数なら、できる整数も3の倍数です。0を含まない該当組は1組につき6通り、0を含む該当組は百の位が0の2通りを除き4通りです。合計${unique.length}通り。`)
    },
  },
  {
    id: 'probability-complement', category: '確率', name: '少なくとも1つの余事象', difficulty: 'easy',
    create: () => {
      const marked = int(2, 5), plain = int(4, 8)
      return probability(`同じ形の封筒が${marked + plain}通あり、うち${marked}通には案内券が入っています。無作為に2通を同時に選ぶとき、少なくとも1通に案内券が入っている確率はいくらですか。各組の選ばれやすさは等しいものとします。`, choose(marked + plain, 2) - choose(plain, 2), choose(marked + plain, 2), `案内券のない${plain}通だけから2通選ぶ場合を、全${choose(marked + plain, 2)}通りから除きます。`)
    },
  },
  {
    id: 'probability-exact', category: '確率', name: '非復元抽出でちょうど指定個数', difficulty: 'normal',
    create: () => {
      const a = int(3, 6), b = int(4, 7)
      return probability(`動作確認済みの端末${a}台と、未確認の端末${b}台から、無作為に3台を重複なく選びます。確認済みがちょうど2台である確率はいくらですか。どの3台の組も同様に確からしいものとします。`, choose(a, 2) * b, choose(a + b, 3), `確認済みから2台、未確認から1台を選ぶので、有利な組は${a}C2×${b} = ${choose(a, 2) * b}通りです。全体は${a + b}C3通り。`)
    },
  },
  {
    id: 'probability-conditional', category: '確率', name: '条件が分かった後の確率', difficulty: 'hard',
    create: () => {
      const a = int(3, 6), b = int(3, 6)
      const total = choose(a + b, 2) - choose(b, 2)
      return probability(`赤ラベル${a}個、青ラベル${b}個の同じ形の試料容器から、2個を同時に無作為抽出しました。「少なくとも1個は赤ラベル」とだけ分かったとき、2個とも赤ラベルである確率はいくらですか。どの2個の組も同様に確からしいものとします。`, choose(a, 2), total, `条件を満たす組は全体から青2個の組を除いた${total}通り。そのうち赤2個は${a}C2 = ${choose(a, 2)}通りです。`)
    },
  },
  {
    id: 'sets-two', category: '集合', name: 'どちらも選ばない人と共通部分', difficulty: 'easy',
    create: () => {
      const onlyA = int(12, 30), onlyB = int(12, 30), both = int(5, 18), neither = int(5, 15)
      return numeric(`${onlyA + onlyB + both + neither}人に、資料A・Bの利用経験を聞きました。Aを利用した人は${onlyA + both}人、Bを利用した人は${onlyB + both}人、どちらも利用していない人は${neither}人です。両方を利用した人は何人ですか。`, both, '人', `少なくとも一方を利用した人数は全体−どちらも利用していない人数です。したがって${onlyA + both}+${onlyB + both}−(${onlyA + onlyB + both + neither}−${neither})=${both}人。`)
    },
  },
  {
    id: 'sets-three', category: '集合', name: '3集合でちょうど2つ', difficulty: 'normal',
    create: () => {
      const ab = int(5, 14), bc = int(5, 14), ca = int(5, 14), all = int(3, 8)
      return numeric(`研修A・B・Cの受講履歴を調べたところ、AとBの両方は${ab + all}人、BとCの両方は${bc + all}人、CとAの両方は${ca + all}人でした。これらには3種類すべての受講者${all}人も含みます。ちょうど2種類を受講した人は何人ですか。`, ab + bc + ca, '人', `各2集合の人数から3種類すべての${all}人をそれぞれ引きます。${ab + all}+${bc + all}+${ca + all}−3×${all}=${ab + bc + ca}人。`)
    },
  },
  {
    id: 'sets-exactly-one', category: '集合', name: '3集合でちょうど1つ', difficulty: 'hard',
    create: () => {
      const [a, b, c, ab, bc, ca, all, none] = Array.from({ length: 8 }, () => int(4, 16))
      const total = a + b + c + ab + bc + ca + all + none
      return numeric(`${total}人に3種類の通知サービスA・B・Cの登録状況を聞きました。登録者数はAが${a + ab + ca + all}人、Bが${b + ab + bc + all}人、Cが${c + bc + ca + all}人です。3つとも登録しているのは${all}人、1つも登録していないのは${none}人です。ちょうど1つに登録しているのは何人ですか。`, a + b + c, '人', `ちょうど1つをx人、ちょうど2つをy人とすると、x+y=${total - none - all}、x+2y=${a + b + c + 2 * (ab + bc + ca)}です。したがってx=2×${total - none - all}−${a + b + c + 2 * (ab + bc + ca)}=${a + b + c}人。`)
    },
  },
  {
    id: 'profit-reverse', category: '損益算', name: '値引き後の利益から原価を逆算', difficulty: 'easy',
    create: () => {
      const cost = int(6, 24) * 100, markup = pick([30, 40, 50]), discount = 10
      const selling = cost * (100 + markup) * (100 - discount) / 10000
      return numeric(`ある部品の定価は原価に${markup}%の利益を見込んで決めました。定価の${discount}%引きで販売したところ、1個あたり${selling - cost}円の利益が出ました。原価はいくらですか。`, cost, '円', `原価をx円とすると、販売額はx×${(100 + markup) / 100}×0.9。利益は販売額−原価なので、x×${((100 + markup) * 90 - 10000) / 10000}=${selling - cost}。原価は${cost}円です。`)
    },
  },
  {
    id: 'profit-stock', category: '損益算', name: '売れ残りを含む全体の利益', difficulty: 'normal',
    create: () => {
      const n = int(4, 9) * 10, cost = int(3, 9) * 100, full = n * 0.6, discounted = n * 0.3
      const revenue = full * cost * 1.5 + discounted * cost * 1.2
      return numeric(`品物を${n}個、1個${cost}円で仕入れ、定価を1個${cost * 1.5}円としました。${full}個を定価で、${discounted}個を定価の20%引きで売り、残りは廃棄しました。仕入れ以外の費用がないとき、全体の利益はいくらですか。`, revenue - n * cost, '円', `値引き価格は${cost * 1.5}×0.8=${cost * 1.2}円。売上${revenue}円から全${n}個の仕入れ額${n * cost}円を引き、${revenue - n * cost}円です。`)
    },
  },
  {
    id: 'profit-tier', category: '損益算', name: '段階別料金とまとめ買い', difficulty: 'hard',
    create: () => {
      const threshold = int(10, 20), extra = int(3, 8), price = int(4, 12) * 100, rate = pick([10, 20, 30])
      const n = threshold + extra
      const saving = threshold * price * rate / 100
      return numeric(`部材の注文では、1回の注文につき最初の${threshold}個は1個${price}円、それを超える分だけ${rate}%引きです。2部署がそれぞれ${n}個ずつ必要としています。別々に注文する場合より、1回にまとめて注文する場合は何円安くなりますか。送料はありません。`, saving, '円', `別注文では割引対象が合計${2 * extra}個、まとめると${2 * n - threshold}個です。割引対象が${threshold}個増えるので、${threshold}×${price}×${rate}/100=${saving}円安くなります。`)
    },
  },
  {
    id: 'speed-meeting', category: '速度算', name: '単位換算と出会い', difficulty: 'easy',
    create: () => {
      const meters = pick([60, 70, 80]), other = pick([40, 50, 90]), minutes = int(8, 20)
      return numeric(`一直線の遊歩道の両端にいる2人が、同時に向かい合って歩き始めます。両端の距離は${(meters + other) * minutes}m、一方は分速${meters}m、もう一方は時速${other * 60 / 1000}kmです。何分後に出会いますか。`, minutes, '分', `時速${other * 60 / 1000}kmは分速${other}m。距離を縮める速さは分速${meters + other}mなので、${(meters + other) * minutes}÷${meters + other}=${minutes}分です。`)
    },
  },
  {
    id: 'speed-average', category: '速度算', name: '休憩を含む往復の平均速度', difficulty: 'normal',
    create: () => {
      const distance = int(2, 6) * 600, slow = 60, fast = 100, rest = int(4, 12)
      const time = distance / slow + distance / fast + rest
      return textQuestion(`片道${distance}mの同じ道を、行きは分速${slow}m、帰りは分速${fast}mで往復し、折り返し地点で${rest}分休みました。休憩を含む全行程の平均の速さは分速何mですか。小数第2位を四捨五入し、小数第1位まで答えてください。`, `${(2 * distance / time).toFixed(1)}m/分`, [80, 75, 2 * distance / (time - rest), distance / time, 2 * distance / (time + rest)].map(x => `${x.toFixed(1)}m/分`), `平均は速さの単純平均ではなく、総距離÷総時間です。${2 * distance}÷(${distance / slow}+${distance / fast}+${rest})=${(2 * distance / time).toFixed(1)}m/分（指定の桁に丸める）。`)
    },
  },
  {
    id: 'speed-catchup', category: '速度算', name: '途中停止を含む追いつき', difficulty: 'hard',
    create: () => {
      const slow = pick([50, 60, 70]), delta = pick([20, 30]), delay = int(8, 12), before = int(3, 5), stop = int(2, 4)
      const fast = slow + delta, remaining = slow * delay - delta * before + slow * stop
      const elapsed = before + stop + remaining / delta
      return textQuestion(`Pが分速${slow}mで出発し、その${delay}分後にQが同じ地点から同じ道を分速${fast}mで追いかけました。Qは出発${before}分後に${stop}分間停止し、その後は元の速さで進みました。Qの出発から追いつくまで何分ですか。Pは歩き続け、小数第2位を四捨五入して小数第1位まで答えてください。`, `${elapsed.toFixed(1)}分`, [elapsed + stop, elapsed - stop, slow * delay / delta, elapsed + delay].map(x => `${x.toFixed(1)}分`), `Q出発時の差は${slow * delay}m。最初の${before}分で${delta * before}m縮まり、停止中に${slow * stop}m広がるので再出発時の差は${remaining}mです。${before}+${stop}+${remaining}÷${delta}=${elapsed.toFixed(1)}分。`)
    },
  },
  {
    id: 'ratio-nested', category: '割合', name: '内訳の割合から全体を復元', difficulty: 'easy',
    create: () => {
      const total = int(3, 12) * 100, group = pick([20, 40, 60]), subset = pick([25, 50, 75])
      const count = total * group * subset / 10000
      return numeric(`ある配送所では、1日の荷物の${group}%が午前便で、そのうち${subset}%が冷蔵便でした。午前便の冷蔵荷物が${count}個だったとき、この日の午後便は何個ですか。便は午前便と午後便だけです。`, total * (100 - group) / 100, '個', `午前便は${count}÷${subset / 100}=${total * group / 100}個。全体はさらに${group / 100}で割って${total}個。午後便は${total}×${(100 - group) / 100}=${total * (100 - group) / 100}個です。`)
    },
  },
  {
    id: 'ratio-mix', category: '割合', name: '濃度の調整と追加量', difficulty: 'normal',
    create: () => {
      const low = pick([4, 6, 8]), target = low + 2, high = target + pick([2, 4, 6]), initial = int(2, 6) * (high - target) * 50
      const extra = initial * (target - low) / (high - target)
      return numeric(`${low}%の食塩水${initial}gに${high}%の食塩水を加え、${target}%にしたいと考えています。蒸発やこぼれがないとき、加える食塩水は何gですか。`, extra, 'g', `追加をx gとして食塩量を等しく置くと、${low}×${initial}+${high}x=${target}(${initial}+x)。したがってx=${initial}×(${target}−${low})÷(${high}−${target})=${extra}gです。`)
    },
  },
  {
    id: 'ratio-change', category: '割合', name: '増減後に元に戻す割合', difficulty: 'hard',
    create: () => {
      const up = pick([20, 25, 40, 50]), down = pick([10, 20, 30].filter(d => (100 + up) * (100 - d) !== 10000))
      const factor = (100 + up) * (100 - down) / 10000
      const value = Math.abs(1 / factor - 1) * 100
      const direction = factor > 1 ? '減らす' : '増やす'
      return textQuestion(`ある設備の処理量を当初より${up}%増やし、その後、その時点の処理量から${down}%減らしました。現在の処理量を基準にして、何%${direction}と当初と同じになりますか。小数第2位を四捨五入して小数第1位まで答えてください。`, `${value.toFixed(1)}%`, [Math.abs(up - down), Math.abs(1 - factor) * 100, value + 5, value + 10].map(x => `${x.toFixed(1)}%`), `当初を1とすると現在は${factor}です。現在を基準にした変化率は|1−${factor}|÷${factor}×100=${value.toFixed(1)}%です。`)
    },
  },
  {
    id: 'table-base', category: '表の読み取り', name: '異なる総数と共通数量', difficulty: 'easy',
    create: () => {
      // 全構成比の組合せで、Bの総数だけでなく各内訳も整数にする。
      const totalA = int(1, 6) * 400, p = pick([20, 30, 40]), q = pick([20, 40, 50]), other = pick([10, 20, 30])
      const totalB = totalA * p / q
      return numeric('次の表は、2つの倉庫の保管品の構成比です。倉庫Aと倉庫Bの部品Xの個数は同じです。倉庫Bの部品Yは何個ですか。構成比は各倉庫の保管総数を100%とした値で、表示値は正確です。', totalB * other / 100, '個', `倉庫AのXは${totalA}×${p / 100}=${totalA * p / 100}個。倉庫Bの総数は${totalA * p / 100}÷${q / 100}=${totalB}個なので、Yは${totalB}×${other / 100}=${totalB * other / 100}個。`, [{ title: '倉庫別の保管内訳', headers: ['倉庫', '総数', 'X', 'Y', 'その他'], rows: [['A', `${totalA}個`, `${p}%`, '30%', `${70 - p}%`], ['B', '不明', `${q}%`, `${other}%`, `${100 - q - other}%`]] }])
    },
  },
  {
    id: 'table-weighted', category: '表の読み取り', name: '2表を用いた加重平均', difficulty: 'normal',
    create: () => {
      const a = int(3, 9) * 100, b = int(3, 9) * 100, ra = pick([60, 70, 80]), rb = pick([50, 65, 75])
      const done = a * ra / 100 + b * rb / 100
      return textQuestion('次の2表は、月曜日に受け付けた依頼件数と、そのうち当日中に完了した割合です。東センターと西センターを合わせた当日完了率は何%ですか。割合は正確な値です。小数第2位を四捨五入し、小数第1位まで答えてください。', `${(done / (a + b) * 100).toFixed(1)}%`, [(ra + rb) / 2, ra, rb, done / (a + b) * 100 + 3, done / (a + b) * 100 - 3].map(x => `${x.toFixed(1)}%`), `完了件数は${a}×${ra / 100}+${b}×${rb / 100}=${done}件。合計${a + b}件が基準なので、${done}÷${a + b}×100=${(done / (a + b) * 100).toFixed(1)}%です。`, [{ title: '表1　受付件数', headers: ['センター', '受付件数'], rows: [['東', `${a}件`], ['西', `${b}件`]] }, { title: '表2　当日完了率', headers: ['センター', '当日完了率'], rows: [['東', `${ra}%`], ['西', `${rb}%`]] }])
    },
  },
  {
    id: 'table-growth', category: '表の読み取り', name: '指数と構成比から数量比', difficulty: 'normal',
    create: () => {
      const index = pick([110, 120, 125, 150]), old = pick([20, 25, 40]), recent = pick([20, 30, 40])
      return textQuestion('次の表は工場の出荷状況です。今年の製品Kの出荷個数は、昨年の何倍ですか。総出荷個数指数は昨年の総出荷個数を100とした値、Kの構成比は各年の総出荷個数に占める割合です。表示値は正確です。小数第3位を四捨五入して小数第2位まで答えてください。', `${(index / 100 * recent / old).toFixed(2)}倍`, [recent / old, index / 100, index / 100 * old / recent, index / 100 * recent / old + 0.2, index / 100 * recent / old + 0.4].map(x => `${x.toFixed(2)}倍`), `昨年の総数を100個と仮定するとKは${old}個、今年のKは${index}×${recent / 100}個です。比は${index}×${recent / 100}÷${old}=${(index / 100 * recent / old).toFixed(2)}倍。`, [{ title: '出荷総数の指数と製品構成', headers: ['年', '総出荷個数指数', 'Kの構成比'], rows: [['昨年', '100', `${old}%`], ['今年', String(index), `${recent}%`]] }])
    },
  },
  {
    id: 'table-fees', category: '表の読み取り', name: '料金表の比較と割引対象', difficulty: 'hard',
    create: () => {
      const hours = int(3, 6), people = int(8, 14), baseA = int(8, 12) * 100, baseB = int(5, 8) * 100, equipment = int(2, 5) * 100
      const prices = [baseA * hours * 0.8 + equipment, baseB * hours + people * 100 + equipment]
      const cheaper = prices[0] < prices[1] ? 'プランA' : prices[0] > prices[1] ? 'プランB' : '同額'
      const answer = cheaper === '同額' ? '両プランは同額' : `${cheaper}が${Math.abs(prices[0] - prices[1])}円安い`
      return textQuestion(`会議室を${people}人で${hours}時間使い、機材を1回借ります。プランAのみ、利用が3時間以上なら室料が20%引きになります（人数加算・機材料は割引対象外）。表の料金は税込みで、ほかの費用はありません。どちらのプランがいくら安いですか。`, answer, ['両プランは同額', `プランAが${Math.abs(prices[0] - prices[1]) || 100}円安い`, `プランBが${Math.abs(prices[0] - prices[1]) || 100}円安い`, `プランAが${Math.abs(prices[0] - prices[1]) + equipment}円安い`, `プランBが${Math.abs(prices[0] - prices[1]) + equipment}円安い`], `プランAは${baseA}×${hours}×0.8+${equipment}=${prices[0]}円。プランBは${baseB}×${hours}+100×${people}+${equipment}=${prices[1]}円。比較すると${answer}です。`, [{ title: '会議室の利用料金', headers: ['プラン', '室料（1時間）', '人数加算（1人・1回）', '機材料（1回）'], rows: [['A', `${baseA}円`, '0円', `${equipment}円`], ['B', `${baseB}円`, '100円', `${equipment}円`]] }])
    },
  },
]
