export interface UsageLimit {
  kind: string
  label: string
  percent: number
  resetsAt: string | null
}

export interface ExtraSpend {
  amount: number
  currency: string
}

export interface UsageSnapshot {
  limits: UsageLimit[]
  extraSpend: ExtraSpend | null
  fetchedAt: string
}

export interface UsageState {
  snapshot: UsageSnapshot | null
  errorMessage: string | null
  isRefreshing: boolean
}

export interface UsageApi {
  onState: (listener: (state: UsageState) => void) => void
  requestState: () => void
  refresh: () => void
  reportContentHeight: (height: number) => void
}

export const IpcChannel = {
  state: 'usage:state',
  requestState: 'usage:request-state',
  refresh: 'usage:refresh',
  contentHeight: 'panel:content-height'
} as const

export function sessionLimitOf(snapshot: UsageSnapshot): UsageLimit | undefined {
  return snapshot.limits.find((limit) => limit.kind === 'session')
}

export type UsageLevel = 'normal' | 'warning' | 'critical'

export function usageLevelFor(percent: number): UsageLevel {
  if (percent >= 90) return 'critical'
  if (percent >= 70) return 'warning'
  return 'normal'
}
