import type { SurveyConfig } from './types'
import raw from './natori-park-survey.json'
import { loadSurveyFromJson } from './loadSurveyJson'

export const natoriParkSurvey: SurveyConfig = loadSurveyFromJson(raw)
