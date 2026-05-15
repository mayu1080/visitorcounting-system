import { useMemo, useState } from 'react'
import { DEFAULT_APP_TITLE_SUFFIX, buildFullAppTitle } from '../surveys/titleLines'
import type { Question, SurveyConfig, Theme } from '../surveys/types'
import { natoriParkSurvey } from '../surveys/natoriPark'
import { buildExportPayload, downloadJson } from './exportSurveyJson'
import { resolveSurveyConfigForPreview } from './resolveSurveyConfig'
import { SurveyPreview } from './SurveyPreview'
import './configEditor.css'

function cloneSurvey(): SurveyConfig {
  return structuredClone(natoriParkSurvey) as SurveyConfig
}

export default function ConfigEditor() {
  const [config, setConfig] = useState<SurveyConfig>(cloneSurvey)
  const [environment, setEnvironment] = useState('test')

  const resolved = useMemo(() => resolveSurveyConfigForPreview(config), [config])
  const exportPayload = useMemo(
    () => buildExportPayload(config, environment),
    [config, environment],
  )
  const jsonText = useMemo(() => JSON.stringify(exportPayload, null, 2), [exportPayload])

  function setTheme<K extends keyof Theme>(key: K, value: Theme[K]) {
    setConfig((c) => ({ ...c, theme: { ...c.theme, [key]: value } }))
  }

  function setThemeStr(key: keyof Theme, raw: string) {
    const v = raw.trim()
    if (
      key === 'backgroundColor' ||
      key === 'textColor' ||
      key === 'accentColor' ||
      key === 'buttonStyle'
    ) {
      if (key === 'buttonStyle') {
        const b = raw as Theme['buttonStyle']
        if (b === 'rounded' || b === 'square' || b === 'pill') setTheme('buttonStyle', b)
      } else {
        setTheme(key, v || (natoriParkSurvey.theme as Theme)[key])
      }
      return
    }
    if (key === 'fontScale') {
      const n = Number.parseFloat(raw)
      setTheme('fontScale', Number.isFinite(n) && n > 0 ? n : 1)
      return
    }
    setTheme(
      key,
      (v ? v : undefined) as Theme[typeof key],
    )
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setConfig((c) => {
      const questions = c.questions.map((q, i) => (i === index ? { ...q, ...patch } : q))
      return { ...c, questions }
    })
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setConfig((c) => {
      const questions = c.questions.map((q, i) => {
        if (i !== qIndex) return q
        const options = q.options.map((o, j) => (j === optIndex ? value : o))
        return { ...q, options }
      })
      return { ...c, questions }
    })
  }

  function addOption(qIndex: number) {
    setConfig((c) => {
      const questions = c.questions.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q,
      )
      return { ...c, questions }
    })
  }

  function removeOption(qIndex: number, optIndex: number) {
    setConfig((c) => {
      const questions = c.questions.map((q, i) => {
        if (i !== qIndex) return q
        if (q.options.length <= 1) return q
        const options = q.options.filter((_, j) => j !== optIndex)
        return { ...q, options }
      })
      return { ...c, questions }
    })
  }

  function addQuestion() {
    setConfig((c) => {
      const n = c.questions.length + 1
      const q: Question = {
        id: `q${n}`,
        text: '',
        shortTitle: '',
        options: ['選択肢1', '選択肢2'],
      }
      return { ...c, questions: [...c.questions, q] }
    })
  }

  function removeQuestion(index: number) {
    setConfig((c) => {
      if (c.questions.length <= 1) return c
      return { ...c, questions: c.questions.filter((_, i) => i !== index) }
    })
  }

  function resetAll() {
    setConfig(cloneSurvey())
    setEnvironment('test')
  }

  const slug = (config.eventId || 'survey').replace(/[^\w.-]+/g, '-')

  return (
    <div className="config-editor-page">
      <div className="config-editor-top">
        <h1>Survey config ジェネレータ</h1>
        <div className="config-editor-links">
          <a href="/">アンケート画面へ</a>
          <button type="button" className="config-editor-btn danger" onClick={resetAll}>
            初期化
          </button>
        </div>
      </div>

      <div className="config-editor-layout">
        <div className="config-editor-forms">
          <section className="config-editor-panel">
            <h2>基本設定</h2>
            <div className="config-editor-section">
              <div className="config-editor-row">
                <label htmlFor="f-title-lead">タイトル1行目（appTitleLead・案件名など）</label>
                <input
                  id="f-title-lead"
                  value={config.appTitleLead ?? ''}
                  onChange={(e) => {
                    const lead = e.target.value
                    setConfig((c) => ({
                      ...c,
                      appTitleLead: lead || undefined,
                      appTitle: buildFullAppTitle(
                        lead,
                        c.appTitleSuffix ?? DEFAULT_APP_TITLE_SUFFIX,
                      ),
                    }))
                  }}
                  placeholder="例: なとりぱーくご利用"
                />
              </div>
              <div className="config-editor-row">
                <label htmlFor="f-title-suffix">タイトル2行目（appTitleSuffix）</label>
                <input
                  id="f-title-suffix"
                  value={config.appTitleSuffix ?? ''}
                  onChange={(e) => {
                    const suffix = e.target.value
                    setConfig((c) => ({
                      ...c,
                      appTitleSuffix: suffix || undefined,
                      appTitle: buildFullAppTitle(
                        c.appTitleLead ?? '',
                        suffix || DEFAULT_APP_TITLE_SUFFIX,
                      ),
                    }))
                  }}
                  placeholder={DEFAULT_APP_TITLE_SUFFIX}
                />
                <span className="config-editor-hint">
                  空欄のときは「{DEFAULT_APP_TITLE_SUFFIX}」
                </span>
              </div>
              <div className="config-editor-row">
                <label htmlFor="f-sub">サブタイトル（appSubtitle・空で非表示）</label>
                <input
                  id="f-sub"
                  value={config.appSubtitle ?? ''}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      appSubtitle: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="config-editor-row">
                <label htmlFor="f-eid">event_id</label>
                <input
                  id="f-eid"
                  value={config.eventId}
                  onChange={(e) => setConfig((c) => ({ ...c, eventId: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label htmlFor="f-ver">survey_version</label>
                <input
                  id="f-ver"
                  value={config.surveyVersion}
                  onChange={(e) => setConfig((c) => ({ ...c, surveyVersion: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label htmlFor="f-env">environment（JSONの meta のみ・DB保存はしない）</label>
                <input
                  id="f-env"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="test / production"
                />
                <span className="config-editor-hint">
                  実際の保存先の environment は Edge の SUBMIT_ENVIRONMENT
                </span>
              </div>
            </div>

            <h2>テーマ（色・ボタン形状）</h2>
            <div className="config-editor-section">
              <div className="config-editor-row">
                <label>背景色</label>
                <input
                  type="text"
                  value={config.theme.backgroundColor}
                  onChange={(e) => setThemeStr('backgroundColor', e.target.value)}
                />
              </div>
              <div className="config-editor-row">
                <label>文字色</label>
                <input
                  type="text"
                  value={config.theme.textColor}
                  onChange={(e) => setThemeStr('textColor', e.target.value)}
                />
              </div>
              <div className="config-editor-row">
                <label>アクセント色</label>
                <input
                  type="text"
                  value={config.theme.accentColor}
                  onChange={(e) => setThemeStr('accentColor', e.target.value)}
                />
              </div>
              <div className="config-editor-row">
                <label>buttonStyle</label>
                <select
                  value={config.theme.buttonStyle}
                  onChange={(e) =>
                    setTheme('buttonStyle', e.target.value as Theme['buttonStyle'])
                  }
                >
                  <option value="rounded">rounded</option>
                  <option value="square">square</option>
                  <option value="pill">pill</option>
                </select>
              </div>
              <div className="config-editor-row">
                <label>fontScale</label>
                <input
                  type="number"
                  step={0.05}
                  min={0.5}
                  max={3}
                  value={config.theme.fontScale}
                  onChange={(e) => setThemeStr('fontScale', e.target.value)}
                />
              </div>
            </div>

            <h2>フォント・サイズ（px・空欄は既定）</h2>
            <div className="config-editor-section">
              {(
                [
                  ['titleFontSize', 'タイトル（ヘッダー／完了の大見出し）'],
                  ['subtitleFontSize', 'サブタイトル'],
                  ['questionFontSize', '質問文'],
                  ['optionFontSize', '選択肢ボタン'],
                  ['buttonFontSize', 'アクションボタン（次へ／送信など）'],
                  ['optionButtonHeight', '選択肢ボタン min-height'],
                  ['actionButtonHeight', 'アクションボタン min-height'],
                  ['buttonBorderRadius', '角丸（未指定時は buttonStyle から）'],
                  ['buttonPaddingX', 'ボタン左右パディング'],
                  ['buttonPaddingY', 'ボタン上下パディング'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="config-editor-row">
                  <label>{label}</label>
                  <input
                    type="text"
                    value={(config.theme[key] as string | undefined) ?? ''}
                    onChange={(e) => setThemeStr(key, e.target.value)}
                    placeholder="例: 32px"
                  />
                </div>
              ))}
            </div>

            <details className="config-editor-details">
              <summary>その他の文言（省略可・空欄は既定）</summary>
              <div className="config-editor-row">
                <label>進捗の接頭辞</label>
                <input
                  value={config.progressPrefix}
                  onChange={(e) => setConfig((c) => ({ ...c, progressPrefix: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>戻る</label>
                <input
                  value={config.backButton}
                  onChange={(e) => setConfig((c) => ({ ...c, backButton: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>次へ</label>
                <input
                  value={config.nextButton}
                  onChange={(e) => setConfig((c) => ({ ...c, nextButton: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>確認タイトル</label>
                <input
                  value={config.confirmTitle}
                  onChange={(e) => setConfig((c) => ({ ...c, confirmTitle: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>送信ボタン</label>
                <input
                  value={config.confirmSubmitButton}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, confirmSubmitButton: e.target.value }))
                  }
                />
              </div>
              <div className="config-editor-row">
                <label>やり直す</label>
                <input
                  value={config.confirmResetButton}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, confirmResetButton: e.target.value }))
                  }
                />
              </div>
              <div className="config-editor-row">
                <label>完了タイトル</label>
                <input
                  value={config.thanksTitle}
                  onChange={(e) => setConfig((c) => ({ ...c, thanksTitle: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>完了メモ</label>
                <input
                  value={config.thanksNote}
                  onChange={(e) => setConfig((c) => ({ ...c, thanksNote: e.target.value }))}
                />
              </div>
              <div className="config-editor-row">
                <label>送信エラー文言</label>
                <input
                  value={config.submitError}
                  onChange={(e) => setConfig((c) => ({ ...c, submitError: e.target.value }))}
                />
              </div>
            </details>

            <h2>質問</h2>
            <div className="config-editor-section">
              {config.questions.map((q, qi) => (
                <div key={qi} className="config-editor-question-card">
                  <div className="config-editor-question-head">
                    <span>質問 {qi + 1}</span>
                    <button
                      type="button"
                      className="config-editor-btn danger"
                      onClick={() => removeQuestion(qi)}
                      disabled={config.questions.length <= 1}
                    >
                      削除
                    </button>
                  </div>
                  <div className="config-editor-row">
                    <label>ID</label>
                    <input
                      value={q.id}
                      onChange={(e) => updateQuestion(qi, { id: e.target.value })}
                    />
                  </div>
                  <div className="config-editor-row">
                    <label>本文</label>
                    <textarea
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    />
                  </div>
                  <div className="config-editor-row">
                    <label>短い見出し（確認画面用）</label>
                    <input
                      value={q.shortTitle ?? ''}
                      onChange={(e) =>
                        updateQuestion(qi, { shortTitle: e.target.value || undefined })
                      }
                    />
                  </div>
                  <div className="config-editor-row">
                    <label>選択肢</label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="config-editor-option-row">
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                        />
                        <button
                          type="button"
                          className="config-editor-btn danger"
                          onClick={() => removeOption(qi, oi)}
                          disabled={q.options.length <= 1}
                        >
                          −
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="config-editor-btn"
                      onClick={() => addOption(qi)}
                    >
                      選択肢を追加
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="config-editor-btn primary" onClick={addQuestion}>
                質問を追加
              </button>
            </div>
          </section>
        </div>

        <div className="config-editor-right">
          <section className="config-editor-panel">
            <h2>プレビュー</h2>
            <p className="config-editor-hint" style={{ marginTop: 0 }}>
              解決済み（空欄フォールバック後）の見た目です
            </p>
            <div className="config-editor-preview-wrap">
              <SurveyPreview config={resolved} />
            </div>
          </section>

          <section className="config-editor-panel" style={{ marginTop: 20 }}>
            <h2>JSON</h2>
            <p className="config-editor-hint">
              survey オブジェクトを TypeScript の <code>SurveyConfig</code> として{' '}
              <code>src/surveys/</code> に貼り付け。Edge の <code>SURVEY_REGISTRY</code>{' '}
              も手動同期が必要です。
            </p>
            <pre className="config-editor-json">{jsonText}</pre>
            <div className="config-editor-actions">
              <button
                type="button"
                className="config-editor-btn primary"
                onClick={() => downloadJson(`${slug}-survey.json`, exportPayload)}
              >
                JSON をダウンロード
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
