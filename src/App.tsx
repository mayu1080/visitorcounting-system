import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { questions } from './questions'

type Screen = 'question' | 'thanks'
type Answers = Record<string, string>

const THANKS_TIMEOUT_MS = 3000

const LABELS = {
  appTitle: 'なとりぱーくご利用についてのアンケート',
  progressPrefix: '質問',
  thanksTitle: 'ご回答ありがとうございました。',
  thanksNote: 'このページは自動的に更新されます。',
  submitError: '送信に失敗しました。もう一度お試しください。',
} as const

export default function App() {
  const [screen, setScreen] = useState<Screen>('question')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const question = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  useEffect(() => {
    if (screen !== 'thanks') return
    const t = setTimeout(() => {
      setScreen('question')
      setCurrentQuestionIndex(0)
      setAnswers({})
      setError(null)
      setSubmitting(false)
    }, THANKS_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [screen])

  function handleAnswer(value: string) {
    if (submitting) return
    setError(null)
    const updatedAnswers = { ...answers, [question.id]: value }
    setAnswers(updatedAnswers)
    if (isLastQuestion) {
      void submit(updatedAnswers)
    } else {
      setCurrentQuestionIndex((index) => index + 1)
    }
  }

  async function submit(finalAnswers: Answers) {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('survey_responses')
      .insert({ answers: finalAnswers })
    setSubmitting(false)
    if (insertError) {
      setError(LABELS.submitError)
      return
    }
    setScreen('thanks')
  }

  return (
    <div className="app">
      <header className="app-header">{LABELS.appTitle}</header>
      <main className="app-main">
        {screen === 'question' && (
          <div className="screen">
            <p className="progress">
              {LABELS.progressPrefix} {currentQuestionIndex + 1} / {questions.length}
            </p>
            <h2 className="question">{question.text}</h2>
            <div className="options">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  className={`option ${answers[question.id] === opt ? 'selected' : ''}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={submitting}
                >
                  {opt}
                </button>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        )}

        {screen === 'thanks' && (
          <div className="screen">
            <h1 className="title">{LABELS.thanksTitle}</h1>
            <p className="note">{LABELS.thanksNote}</p>
          </div>
        )}
      </main>
    </div>
  )
}
