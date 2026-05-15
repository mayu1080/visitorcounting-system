import { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
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
  const radius = theme.buttonBorderRadius?.trim() || getButtonRadius(theme.buttonStyle)

  const titleFs = theme.titleFontSize?.trim()
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
    '--font-subtitle': theme.subtitleFontSize?.trim() || scaled(TYPO.subtitle, s),
    '--font-question': theme.questionFontSize?.trim() || scaled(TYPO.question, s),
    '--font-button': theme.optionFontSize?.trim() || scaled(TYPO.option, s),
    '--font-button-primary': theme.buttonFontSize?.trim() || scaled(TYPO.buttonPrimary, s),
    '--font-progress': scaled(TYPO.progress, s),
    '--font-note': scaled(TYPO.note, s),
    '--font-error': scaled(TYPO.error, s),
  }

  const px = theme.buttonPaddingX?.trim()
  const py = theme.buttonPaddingY?.trim()
  if (px) out['--button-pad-x'] = px
  if (py) out['--button-pad-y'] = py
  const oh = theme.optionButtonHeight?.trim()
  if (oh) out['--option-min-height'] = oh
  const ah = theme.actionButtonHeight?.trim()
  if (ah) out['--action-min-height'] = ah

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
