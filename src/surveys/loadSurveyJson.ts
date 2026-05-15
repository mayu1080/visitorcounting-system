import type { SurveyConfig, Theme } from './types'

/** ジェネレータのダウンロード形式（survey ラップ）または SurveyConfig 単体のどちらも受け付ける */
type SurveyExportFile = {
  _readme?: string
  meta?: { environment?: string }
  survey?: SurveyConfig
}

const THEME_PX_KEYS: (keyof Theme)[] = [
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

function isBareNumberPx(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim())
}

/** JSON 由来の theme で「32」のように単位だけ欠けている値を px 補完する */
function normalizeThemeUnits(theme: Theme): Theme {
  const t = { ...theme }
  for (const key of THEME_PX_KEYS) {
    const v = t[key]
    if (typeof v === 'string' && isBareNumberPx(v)) {
      ;(t as Record<string, unknown>)[key as string] = `${v.trim()}px`
    }
  }
  return t
}

/**
 * `natori-park-survey.json` などを import した値から `SurveyConfig` を得る。
 * - ルートに `survey` があればそれを使う（ジェネレータのダウンロード形式）
 * - なければルート自体を SurveyConfig として扱う
 */
export function loadSurveyFromJson(data: unknown): SurveyConfig {
  if (data === null || typeof data !== 'object') {
    throw new Error('Survey JSON: ルートはオブジェクトである必要があります')
  }

  const root = data as SurveyExportFile & SurveyConfig
  const survey: SurveyConfig =
    root.survey !== undefined && typeof root.survey === 'object' && root.survey !== null
      ? root.survey
      : (root as SurveyConfig)

  if (!survey.eventId?.trim()) {
    throw new Error('Survey JSON: eventId がありません')
  }
  if (!Array.isArray(survey.questions) || survey.questions.length === 0) {
    throw new Error('Survey JSON: questions が空または不正です')
  }
  if (!survey.theme || typeof survey.theme !== 'object') {
    throw new Error('Survey JSON: theme がありません')
  }

  const cloned = structuredClone(survey) as SurveyConfig
  cloned.theme = normalizeThemeUnits(cloned.theme)
  return cloned
}
