import type { SurveyConfig } from './types'
import { getAppTitleLines } from './titleLines'

type Props = { config: SurveyConfig }

export function AppTitle({ config }: Props) {
  const { lead, suffix } = getAppTitleLines(config)
  if (!suffix) {
    return <span className="app-title-single">{lead}</span>
  }
  return (
    <span className="app-title">
      <span className="app-title-lead">{lead}</span>
      <span className="app-title-suffix">{suffix}</span>
    </span>
  )
}
