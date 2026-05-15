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

/** ジェネレータ JSON では数値（20）や文字列（"20" / "20px"）のどちらもあり得る */
export function themeLengthToCss(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`
  }
  if (typeof value === 'string') {
    const v = value.trim()
    if (!v) return undefined
    if (/^\d+(\.\d+)?$/.test(v)) return `${v}px`
    return v
  }
  return undefined
}

/** JSON 由来の theme で単位を px に揃える */
function normalizeThemeUnits(theme: Theme): Theme {
  const t = { ...theme }
  for (const key of THEME_PX_KEYS) {
    const raw = t[key]
    const css = themeLengthToCss(raw)
    if (css !== undefined) {
      ;(t as Record<string, unknown>)[key as string] = css
    } else if (raw !== undefined) {
      delete (t as Record<string, unknown>)[key as string]
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
