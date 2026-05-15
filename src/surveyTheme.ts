import { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { themeLengthToCss } from './surveys/loadSurveyJson'
import type { Theme } from './surveys/types'

export function getButtonRadius(buttonStyle: Theme['buttonStyle']): string {
  if (buttonStyle === 'square') return '4px'
  if (buttonStyle === 'pill') return '999px'
  return '16px'
}

/** :root と同等の既定 px（fontScale は別途 --font-scale で掛ける） */
const TYPO = {
  title: 40,
  appTitle: 28,
  subtitle: 16,
  question: 32,
  option: 24,
  buttonPrimary: 26,
  progress: 18,
  note: 16,
  error: 18,
} as const

function scaled(px: number, scale: number): string {
  return `calc(${px}px * ${scale})`
}

/**
 * アンケート画面のルート要素に渡す CSS 変数。
 * theme の省略可能フィールドが空のときは従来どおり計算式を使う。
 */
export function surveyThemeToCssProperties(theme: Theme): CSSProperties {
  const s = theme.fontScale ?? 1
  const radius =
    themeLengthToCss(theme.buttonBorderRadius) || getButtonRadius(theme.buttonStyle)

  const titleFs = themeLengthToCss(theme.titleFontSize)
  const appTitleVal = titleFs || scaled(TYPO.appTitle, s)
  const thanksTitleVal = titleFs || scaled(TYPO.title, s)

  const out: Record<string, string> = {
    '--color-bg': theme.backgroundColor,
    '--color-fg': theme.textColor,
    '--color-accent': theme.accentColor,
    '--font-scale': String(s),
    '--radius': radius,
    '--font-app-title': appTitleVal,
    '--font-title': thanksTitleVal,
    '--font-subtitle': themeLengthToCss(theme.subtitleFontSize) || scaled(TYPO.subtitle, s),
    '--font-question': themeLengthToCss(theme.questionFontSize) || scaled(TYPO.question, s),
    '--font-button': themeLengthToCss(theme.optionFontSize) || scaled(TYPO.option, s),
    '--font-button-primary':
      themeLengthToCss(theme.buttonFontSize) || scaled(TYPO.buttonPrimary, s),
    '--font-progress': scaled(TYPO.progress, s),
    '--font-note': scaled(TYPO.note, s),
    '--font-error': scaled(TYPO.error, s),
  }

  const padX = themeLengthToCss(theme.buttonPaddingX)
  const padY = themeLengthToCss(theme.buttonPaddingY)
  if (padX) out['--button-pad-x'] = padX
  if (padY) out['--button-pad-y'] = padY
  const optH = themeLengthToCss(theme.optionButtonHeight)
  if (optH) out['--option-min-height'] = optH
  const actH = themeLengthToCss(theme.actionButtonHeight)
  if (actH) out['--action-min-height'] = actH

  return out as CSSProperties
}

/**
 * テーマ用 CSS 変数を documentElement に載せる。
 * 古い Android WebView（Fully Kiosk 等）では div の inline style だけだと var() が効かないことがある。
 */
export function useSurveyThemeOnDocument(theme: Theme): CSSProperties {
  const style = useMemo(() => surveyThemeToCssProperties(theme), [theme])

  useEffect(() => {
    const props = surveyThemeToCssProperties(theme)
    const root = document.documentElement
    const previous = new Map<string, string>()

    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== 'string' || !key.startsWith('--')) continue
      previous.set(key, root.style.getPropertyValue(key))
      root.style.setProperty(key, value)
    }

    const bg = theme.backgroundColor
    if (bg) {
      previous.set('__body_bg', document.body.style.background)
      document.body.style.background = bg
    }

    return () => {
      for (const [key, val] of previous) {
        if (key === '__body_bg') {
          document.body.style.background = val
        } else if (val) {
          root.style.setProperty(key, val)
        } else {
          root.style.removeProperty(key)
        }
      }
    }
  }, [theme])

  return style
}
