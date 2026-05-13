export type Question = {
  id: string
  text: string
  shortTitle?: string
  options: string[]
}

export type Theme = {
  backgroundColor: string
  textColor: string
  accentColor: string
  buttonStyle: 'rounded' | 'square' | 'pill'
  fontScale: number
}

export type SurveyConfig = {
  eventId: string
  surveyVersion: string
  appTitle: string
  appSubtitle?: string
  progressPrefix: string
  backButton: string
  nextButton: string
  confirmTitle: string
  confirmSubmitButton: string
  confirmResetButton: string
  thanksTitle: string
  thanksNote: string
  submitError: string
  questions: Question[]
  theme: Theme
}
