import { surveyConfig } from './surveyConfig'
import type { Question } from './surveys/types'

export type { Question }
export const questions: Question[] = surveyConfig.questions
