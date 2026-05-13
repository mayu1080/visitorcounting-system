import type { SurveyConfig } from './types'

export const natoriParkSurvey: SurveyConfig = {
  eventId: 'natori-park',
  surveyVersion: 'v1.0.0_2026-05-13',
  appTitle: 'なとりぱーくご利用についてのアンケート',
  progressPrefix: '質問',
  backButton: '戻る',
  nextButton: '次に進む',
  confirmTitle: 'この回答でよろしいですか？',
  confirmSubmitButton: '送信する',
  confirmResetButton: '回答をやり直す',
  thanksTitle: 'ご回答ありがとうございました。',
  thanksNote: 'このページは自動的に更新されます。',
  submitError: '送信に失敗しました。もう一度お試しください。',
  theme: {
    backgroundColor: '#0f1115',
    textColor: '#f5f5f7',
    accentColor: '#ffc857',
    buttonStyle: 'rounded',
    fontScale: 1,
  },
  questions: [
    {
      id: 'q1',
      text: '今日は何名様でのご来場ですか？',
      shortTitle: 'Q1. ご来場人数',
      options: ['1人', '2人', '3人', '4名以上'],
    },
    {
      id: 'q2',
      text: 'お子様の年齢について、当てはまる年代は？',
      shortTitle: 'Q2. お子様の年齢',
      options: ['0~1歳', '2~3歳', '4~6歳', '7歳以上'],
    },
    {
      id: 'q3',
      text: '本日はどこからお越しいただきましたか？',
      shortTitle: 'Q3. ご来訪エリア',
      options: ['名取市内', '仙台市内', 'それ以外の地域'],
    },
    {
      id: 'q4',
      text: '何回目のご利用ですか？',
      shortTitle: 'Q4. ご利用回数',
      options: ['初めて', '2回目', '3回目', '4回以上'],
    },
  ],
}
