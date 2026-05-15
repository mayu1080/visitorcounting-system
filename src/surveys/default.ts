/** `VITE_SURVEY_CONFIG=default` のときに使う。未指定時の暗黙のフォールバックはしない */
import { natoriParkSurvey } from './natoriPark'
import type { SurveyConfig } from './types'

export const defaultSurvey: SurveyConfig = natoriParkSurvey
