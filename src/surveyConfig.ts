import { defaultSurvey } from './surveys/default'
import { natoriParkSurvey } from './surveys/natoriPark'

const surveyConfigs = {
  default: defaultSurvey,
  'natori-park': natoriParkSurvey,
} as const

type SurveyConfigName = keyof typeof surveyConfigs

const configuredSurvey = import.meta.env.VITE_SURVEY_CONFIG as string | undefined

export const surveyConfig =
  configuredSurvey && configuredSurvey in surveyConfigs
    ? surveyConfigs[configuredSurvey as SurveyConfigName]
    : surveyConfigs.default

export const surveyEnvironment =
  (import.meta.env.VITE_ENVIRONMENT as string | undefined) ?? 'test'

export const availableSurveyConfigs = Object.keys(surveyConfigs)
