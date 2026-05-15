import { defaultSurvey } from './surveys/default'
import { natoriParkSurvey } from './surveys/natoriPark'

const surveyConfigs = {
  default: defaultSurvey,
  'natori-park': natoriParkSurvey,
} as const

type SurveyConfigName = keyof typeof surveyConfigs

const rawKey = import.meta.env.VITE_SURVEY_CONFIG as string | undefined

function resolveSurveyConfigKey(): SurveyConfigName {
  const key = rawKey?.trim()
  if (!key) {
    throw new Error(
      'VITE_SURVEY_CONFIG is required. Set it in .env.local (dev) or Vercel (e.g. natori-park).',
    )
  }
  if (!(key in surveyConfigs)) {
    throw new Error(
      `Unknown VITE_SURVEY_CONFIG "${key}". Allowed: ${Object.keys(surveyConfigs).join(', ')}`,
    )
  }
  return key as SurveyConfigName
}

if (import.meta.env.PROD) {
  const env = (import.meta.env.VITE_ENVIRONMENT as string | undefined)?.trim()
  if (!env) {
    throw new Error(
      'VITE_ENVIRONMENT is required for production builds (e.g. test or production).',
    )
  }
}

export const surveyConfigKey = resolveSurveyConfigKey()
export const surveyConfig = surveyConfigs[surveyConfigKey]

export const availableSurveyConfigs = Object.keys(surveyConfigs)
