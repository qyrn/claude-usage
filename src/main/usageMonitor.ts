import type { UsageState } from '../shared/usage'
import { readAccessToken } from './credentials'
import { fetchUsage } from './usageClient'
import { UsageUnavailableError } from './usageUnavailableError'

const basePollIntervalMs = 15 * 60_000
const maxPollIntervalMs = 60 * 60_000
const panelStaleAfterMs = 5 * 60_000

export interface UsageMonitor {
  start: () => void
  refresh: () => Promise<void>
  refreshIfStale: () => Promise<void>
  getState: () => UsageState
}

export function createUsageMonitor(onChange: (state: UsageState) => void): UsageMonitor {
  let state: UsageState = { snapshot: null, error: null, isRefreshing: false }
  let consecutiveRateLimits = 0
  let nextAttemptAt = 0
  let timer: NodeJS.Timeout | null = null
  let pendingRefresh: Promise<void> | null = null

  function update(next: Partial<UsageState>): void {
    state = { ...state, ...next }
    onChange(state)
  }

  function scheduleNext(delayMs: number): void {
    if (timer) clearTimeout(timer)
    nextAttemptAt = Date.now() + delayMs
    timer = setTimeout(() => void refresh(), delayMs)
  }

  function delayAfterRateLimit(): number {
    return Math.min(basePollIntervalMs * 2 ** (consecutiveRateLimits - 1), maxPollIntervalMs)
  }

  async function runRefresh(): Promise<void> {
    update({ isRefreshing: true })
    try {
      const snapshot = await fetchUsage(await readAccessToken())
      consecutiveRateLimits = 0
      update({ snapshot, error: null, isRefreshing: false })
      scheduleNext(basePollIntervalMs)
    } catch (caught) {
      const error =
        caught instanceof UsageUnavailableError
          ? { message: caught.message, kind: caught.kind }
          : { message: 'Erreur inattendue.', kind: 'unexpected' as const }
      if (error.kind === 'rateLimit') consecutiveRateLimits++
      update({ error, isRefreshing: false })
      scheduleNext(error.kind === 'rateLimit' ? delayAfterRateLimit() : basePollIntervalMs)
    }
  }

  function refresh(): Promise<void> {
    pendingRefresh ??= runRefresh().finally(() => {
      pendingRefresh = null
    })
    return pendingRefresh
  }

  function isSnapshotFresh(): boolean {
    const fetchedAt = state.snapshot?.fetchedAt
    return fetchedAt !== undefined && Date.now() - new Date(fetchedAt).getTime() < panelStaleAfterMs
  }

  return {
    start: () => void refresh(),
    refresh,
    refreshIfStale: () => (isSnapshotFresh() || Date.now() < nextAttemptAt ? Promise.resolve() : refresh()),
    getState: () => state
  }
}
