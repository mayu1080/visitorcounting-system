import type { SurveyConfig } from './types'

/** 2行目の共通文言（案件ごとに変えないときは JSON に書かなくてよい） */
export const DEFAULT_APP_TITLE_SUFFIX = 'についてのアンケート'

export type AppTitleLines = {
  lead: string
  suffix: string
}

/** ヘッダー表示用。appTitleLead があれば2行、なければ従来の appTitle を1行 */
export function getAppTitleLines(config: SurveyConfig): AppTitleLines {
  const lead = config.appTitleLead?.trim()
  if (lead) {
    return {
      lead,
      suffix: config.appTitleSuffix?.trim() || DEFAULT_APP_TITLE_SUFFIX,
    }
  }
  const full = config.appTitle.trim()
  const suffix = DEFAULT_APP_TITLE_SUFFIX
  if (full.endsWith(suffix)) {
    return {
      lead: full.slice(0, -suffix.length).trim() || full,
      suffix,
    }
  }
  return { lead: full, suffix: '' }
}

/** appTitle フィールド用（1行連結・後方互換） */
export function buildFullAppTitle(lead: string, suffix?: string): string {
  const l = lead.trim()
  if (!l) return ''
  return l + (suffix?.trim() || DEFAULT_APP_TITLE_SUFFIX)
}
