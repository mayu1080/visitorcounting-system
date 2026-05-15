import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { surveyConfig, surveyConfigKey } from './surveyConfig'
import { useSurveyThemeOnDocument } from './surveyTheme'

type Screen = 'question' | 'confirm' | 'thanks'
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
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnsweredCurrent = Boolean(answers[question.id])
  const themeStyle = useSurveyThemeOnDocument(theme)

  useEffect(() => {
    if (screen !== 'thanks') return
    const t = setTimeout(resetSurvey, THANKS_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [screen])

  function resetSurvey() {
    setScreen('question')
    setCurrentQuestionIndex(0)
    setAnswers({})
    setError(null)
    setSubmitting(false)
  }

  function handleAnswer(value: string) {
    if (submitting) return
    setError(null)
    setAnswers((current) => ({ ...current, [question.id]: value }))
  }

  function handleBack() {
    if (submitting || isFirstQuestion) return
    setError(null)
    setCurrentQuestionIndex((index) => index - 1)
  }

  function handleNext() {
    if (submitting || !hasAnsweredCurrent) return
    setError(null)
    if (isLastQuestion) {
      setScreen('confirm')
    } else {
      setCurrentQuestionIndex((index) => index + 1)
    }
  }

  function handleConfirmBack() {
    if (submitting) return
    setError(null)
    setScreen('question')
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('submit-response', {
        body: { configKey: surveyConfigKey, answers },
      })
      if (fnError) {
        setError(surveyConfig.submitError)
        return
      }
      if (!data || typeof data !== 'object' || (data as { ok?: boolean }).ok !== true) {
        setError(surveyConfig.submitError)
        return
      }
      setScreen('thanks')
    } finally {
      setSubmitting(false)
    }
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
            <div className="nav">
              <button
                className="nav-button secondary"
                onClick={handleBack}
                disabled={isFirstQuestion || submitting}
              >
                {surveyConfig.backButton}
              </button>
              <button
                className="nav-button primary"
                onClick={handleNext}
                disabled={!hasAnsweredCurrent || submitting}
              >
                {surveyConfig.nextButton}
              </button>
            </div>
          </div>
        )}

        {screen === 'confirm' && (
          <div className="screen">
            <h2 className="question">{surveyConfig.confirmTitle}</h2>
            <ul className="review">
              {questions.map((q) => (
                <li key={q.id} className="review-item">
                  <span className="review-question">{q.shortTitle ?? q.text}</span>
                  <span className="review-answer">{answers[q.id] ?? ''}</span>
                </li>
              ))}
            </ul>
            {error && <p className="error">{error}</p>}
            <div className="nav">
              <button
                className="nav-button secondary"
                onClick={resetSurvey}
                disabled={submitting}
              >
                {surveyConfig.confirmResetButton}
              </button>
              <button
                className="nav-button primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {surveyConfig.confirmSubmitButton}
              </button>
            </div>
            <button
              className="link-button"
              onClick={handleConfirmBack}
              disabled={submitting}
            >
              ← {surveyConfig.backButton}
            </button>
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
