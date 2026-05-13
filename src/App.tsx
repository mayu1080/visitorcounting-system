import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from './supabase'
import { surveyConfig, surveyEnvironment } from './surveyConfig'

type Screen = 'question' | 'thanks'
type Answers = Record<string, string>

const THANKS_TIMEOUT_MS = 3000

export default function App() {
  const [screen, setScreen] = useState<Screen>('question')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { questions, theme } = surveyConfig
  const question = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const themeStyle = useMemo(
    () =>
      ({
        '--color-bg': theme.backgroundColor,
        '--color-fg': theme.textColor,
        '--color-accent': theme.accentColor,
        '--font-scale': String(theme.fontScale),
        '--radius': getButtonRadius(theme.buttonStyle),
      }) as CSSProperties,
    [theme],
  )

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
      .insert({
        event_id: surveyConfig.eventId,
        environment: surveyEnvironment,
        survey_version: surveyConfig.surveyVersion,
        answers: finalAnswers,
      })
    setSubmitting(false)
    if (insertError) {
      setError(surveyConfig.submitError)
      return
    }
    setScreen('thanks')
  }

  return (
    <div className={`app button-style-${theme.buttonStyle}`} style={themeStyle}>
      <header className="app-header">
        {surveyConfig.appTitle}
        {surveyConfig.appSubtitle && (
          <span className="app-subtitle">{surveyConfig.appSubtitle}</span>
        )}
      </header>
      <main className="app-main">
        {screen === 'question' && (
          <div className="screen">
            <p className="progress">
              {surveyConfig.progressPrefix} {currentQuestionIndex + 1} / {questions.length}
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
            <h1 className="title">{surveyConfig.thanksTitle}</h1>
            <p className="note">{surveyConfig.thanksNote}</p>
          </div>
        )}
      </main>
    </div>
  )
}

function getButtonRadius(buttonStyle: typeof surveyConfig.theme.buttonStyle) {
  if (buttonStyle === 'square') return '4px'
  if (buttonStyle === 'pill') return '999px'
  return '16px'
}
