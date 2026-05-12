export type Question = {
  id: string
  text: string
  options: string[]
}

export const questions: Question[] = [
  {
    id: 'q1',
    text: '今日は何名様でのご来場ですか？',
    options: ['1人', '2人', '3人', '4名以上'],
  },
  {
    id: 'q2',
    text: 'お子様の年齢について、当てはまる年代は？',
    options: ['0~1歳', '2~3歳', '4~6歳', '7歳以上'],
  },
  {
    id: 'q3',
    text: '本日はどこからお越しいただきましたか？',
    options: ['名取市内', '仙台市内', 'それ以外の地域'],
  },
  {
    id: 'q4',
    text: '何回目のご利用ですか？',
    options: ['初めて', '2回目', '3回目', '4回以上'],
  },
]
