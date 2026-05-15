/** theme の px 指定（数値・文字列どちらも可）を CSS 長さに変換 */

export function themeLengthToCss(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`
  }
  if (typeof value === 'string') {
    const v = value.trim()
    if (!v) return undefined
    if (/^\d+(\.\d+)?$/.test(v)) return `${v}px`
    return v
  }
  return undefined
}

const THEME_PX_KEYS = [
  'titleFontSize',
  'subtitleFontSize',
  'questionFontSize',
  'optionFontSize',
  'buttonFontSize',
  'optionButtonHeight',
  'actionButtonHeight',
  'buttonBorderRadius',
  'buttonPaddingX',
  'buttonPaddingY',
] as const

/** JSON の theme で数値が混ざっていても CSS 用 string に揃える */
export function normalizeThemePxFields<T extends Record<string, unknown>>(theme: T): T {
  const t: Record<string, unknown> = { ...theme }
  for (const key of THEME_PX_KEYS) {
    const raw = t[key]
    const css = themeLengthToCss(raw)
    if (css !== undefined) {
      t[key] = css
    } else if (raw !== undefined) {
      delete t[key]
    }
  }
  return t as T
}
