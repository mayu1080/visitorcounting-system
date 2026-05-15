import type { SurveyConfig } from '../surveys/types'
import { resolveSurveyConfigForPreview, stripEmptyThemeOptionals } from './resolveSurveyConfig'

export type SurveyExportPayload = {
  _readme: string
  meta: { environment: string }
  survey: SurveyConfig
}

export function buildExportPayload(
  draft: SurveyConfig,
  environment: string,
): SurveyExportPayload {
  const resolved = resolveSurveyConfigForPreview(draft)
  return {
    _readme:
      'survey を SurveyConfig として src/surveys/*.ts にコピーして利用。meta.environment は運用メモ（ソースの型には含めない）。Edge Function の SURVEY_REGISTRY も手動で合わせること。',
    meta: { environment: environment.trim() || 'test' },
    survey: { ...resolved, theme: stripEmptyThemeOptionals(resolved.theme) },
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
