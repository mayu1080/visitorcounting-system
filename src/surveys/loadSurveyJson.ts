import type { SurveyConfig, Theme } from './types'
import { normalizeThemePxFields } from './themeLength'

/** ジェネレータのダウンロード形式（survey ラップ）または SurveyConfig 単体のどちらも受け付ける */
type SurveyExportFile = {
  _readme?: string
  meta?: { environment?: string }
  survey?: SurveyConfig
}

function normalizeThemeUnits(theme: Theme): Theme {
  return normalizeThemePxFields(theme) as Theme
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
