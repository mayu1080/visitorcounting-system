import { useEffect, useMemo, useState } from 'react'
import type { SurveyConfig } from '../surveys/types'
import { surveyThemeToCssProperties } from '../surveyTheme'

type Screen = 'question' | 'confirm' | 'thanks'

type Props = {
  config: SurveyConfig
}

/** 本番と同じ DOM クラスで、編集内容を反映したミニプレビュー */
export function SurveyPreview({ config }: Props) {
  const [screen, setScreen] = useState<Screen>('question')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const { questions, theme } = config

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, questions.length - 1)))
  }, [questions.length, questions.map((q) => q.id).join('|')])

  const question = questions[currentIndex] ?? questions[0]
  const isFirst = currentIndex === 0
  const isLast = currentIndex >= questions.length - 1
  const hasAnswer = Boolean(question && answers[question.id])
  const themeStyle = useMemo(() => surveyThemeToCssProperties(theme), [theme])

  function reset() {
    setScreen('question')
    setCurrentIndex(0)
    setAnswers({})
  }

  if (!question) {
    return <p className="config-editor-muted">質問を1件以上追加してください</p>
  }

  return (
    <div
      className={`app button-style-${theme.buttonStyle} survey-preview-scale`}
      style={themeStyle}
    >
      <header className="app-header">
        {config.appTitle}
        {config.appSubtitle && <span className="app-subtitle">{config.appSubtitle}</span>}
      </header>
      <main className="app-main">
        {screen === 'question' && (
          <div className="screen">
            <p className="progress">
              {config.progressPrefix} {currentIndex + 1} / {questions.length}
            </p>
            <h2 className="question">{question.text}</h2>
            <div className="options">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`option ${answers[question.id] === opt ? 'selected' : ''}`}
                  onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt }))}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="nav">
              <button
                type="button"
                className="nav-button secondary"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={isFirst}
              >
                {config.backButton}
              </button>
              <button
                type="button"
                className="nav-button primary"
                onClick={() => {
                  if (isLast) setScreen('confirm')
                  else setCurrentIndex((i) => i + 1)
                }}
                disabled={!hasAnswer}
              >
                {config.nextButton}
              </button>
            </div>
          </div>
        )}

        {screen === 'confirm' && (
          <div className="screen">
            <h2 className="question">{config.confirmTitle}</h2>
            <ul className="review">
              {questions.map((q) => (
                <li key={q.id} className="review-item">
                  <span className="review-question">{q.shortTitle ?? q.text}</span>
                  <span className="review-answer">{answers[q.id] ?? ''}</span>
                </li>
              ))}
            </ul>
            <div className="nav">
              <button type="button" className="nav-button secondary" onClick={reset}>
                {config.confirmResetButton}
              </button>
              <button type="button" className="nav-button primary" onClick={() => setScreen('thanks')}>
                {config.confirmSubmitButton}
              </button>
            </div>
            <button type="button" className="link-button" onClick={() => setScreen('question')}>
              ← {config.backButton}
            </button>
          </div>
        )}

        {screen === 'thanks' && (
          <div className="screen">
            <h1 className="title">{config.thanksTitle}</h1>
            <p className="note">{config.thanksNote}</p>
            <button type="button" className="nav-button secondary" onClick={reset}>
              プレビューを最初から
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
