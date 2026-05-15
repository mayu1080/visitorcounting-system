import { DEFAULT_APP_TITLE_SUFFIX, buildFullAppTitle } from '../surveys/titleLines'
import type { Question, SurveyConfig, Theme } from '../surveys/types'
import { natoriParkSurvey } from '../surveys/natoriPark'

const DEFAULT = structuredClone(natoriParkSurvey) as SurveyConfig

const THEME_OPTIONAL_KEYS: (keyof Theme)[] = [
  'titleFontSize',
  'subtitleFontSize',
  'questionFontSize',
  'optionFontSize',
  'buttonFontSize',
  'optionButtonHeight',
  'actionButtonHeight',
  'buttonBorderRadius',
  'buttonPaddingX',
  'buttonPaddingY',
]

export function stripEmptyThemeOptionals(theme: Theme): Theme {
  const t = { ...theme }
  for (const k of THEME_OPTIONAL_KEYS) {
    const v = t[k]
    if (v === undefined || (typeof v === 'string' && !v.trim())) {
      delete (t as Record<string, unknown>)[k as string]
    }
  }
  return t
}

/** 空欄は DEFAULT にフォールバック（プレビュー・エクスポート用） */
export function resolveSurveyConfigForPreview(s: SurveyConfig): SurveyConfig {
  const themeBase: Theme = { ...DEFAULT.theme, ...s.theme }
  const theme = stripEmptyThemeOptionals(themeBase)

  const questions: Question[] = s.questions.map((q, i) => {
    const d = DEFAULT.questions[i]
    const opts = q.options.map((o) => o.trim()).filter(Boolean)
    return {
      id: q.id.trim() || d?.id || `q${i + 1}`,
      text: q.text.trim() || d?.text || `質問 ${i + 1}`,
      shortTitle: (q.shortTitle?.trim() || d?.shortTitle) || undefined,
      options: opts.length ? opts : d?.options ? [...d.options] : ['はい', 'いいえ'],
    }
  })

  const appTitleLead = s.appTitleLead?.trim() || DEFAULT.appTitleLead?.trim()
  const appTitleSuffix =
    s.appTitleSuffix?.trim() || DEFAULT.appTitleSuffix?.trim() || DEFAULT_APP_TITLE_SUFFIX

  return {
    eventId: s.eventId.trim() || DEFAULT.eventId,
    surveyVersion: s.surveyVersion.trim() || DEFAULT.surveyVersion,
    appTitle:
      s.appTitle.trim() ||
      (appTitleLead ? buildFullAppTitle(appTitleLead, appTitleSuffix) : DEFAULT.appTitle),
    appTitleLead: appTitleLead || undefined,
    appTitleSuffix: appTitleLead ? appTitleSuffix : undefined,
    appSubtitle: (() => {
      const t = s.appSubtitle?.trim()
      return t || undefined
    })(),
    progressPrefix: s.progressPrefix.trim() || DEFAULT.progressPrefix,
    backButton: s.backButton.trim() || DEFAULT.backButton,
    nextButton: s.nextButton.trim() || DEFAULT.nextButton,
    confirmTitle: s.confirmTitle.trim() || DEFAULT.confirmTitle,
    confirmSubmitButton: s.confirmSubmitButton.trim() || DEFAULT.confirmSubmitButton,
    confirmResetButton: s.confirmResetButton.trim() || DEFAULT.confirmResetButton,
    thanksTitle: s.thanksTitle.trim() || DEFAULT.thanksTitle,
    thanksNote: s.thanksNote.trim() || DEFAULT.thanksNote,
    submitError: s.submitError.trim() || DEFAULT.submitError,
    theme,
    questions: questions.length ? questions : structuredClone(DEFAULT.questions),
  }
}
