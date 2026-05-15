export type Question = {
  id: string
  text: string
  shortTitle?: string
  options: string[]
}

/** 未指定時は CSS / surveyTheme で既存デフォルト（計算式）を使う */
export type ThemeTypography = {
  titleFontSize?: string
  subtitleFontSize?: string
  questionFontSize?: string
  optionFontSize?: string
  buttonFontSize?: string
  optionButtonHeight?: string
  actionButtonHeight?: string
  buttonBorderRadius?: string
  buttonPaddingX?: string
  buttonPaddingY?: string
}

export type Theme = {
  backgroundColor: string
  textColor: string
  accentColor: string
  buttonStyle: 'rounded' | 'square' | 'pill'
  fontScale: number
} & ThemeTypography

export type SurveyConfig = {
  eventId: string
  surveyVersion: string
  /** 1行表示用。appTitleLead があるときはフォールバック */
  appTitle: string
  /** 1行目（案件名など）。指定時は2行表示 */
  appTitleLead?: string
  /** 2行目。未指定時は「についてのアンケート」 */
  appTitleSuffix?: string
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
