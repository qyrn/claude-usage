import type { UsageState } from '../shared/usage'
import { readAccessToken } from './credentials'
import { fetchUsage } from './usageClient'
import { UsageUnavailableError } from './usageUnavailableError'

const pollIntervalMs = 2 * 60_000
const staleAfterMs = 20_000

export interface UsageMonitor {
  start: () => void
  refresh: () => Promise<void>
  refreshIfStale: () => Promise<void>
  getState: () => UsageState
}

export function createUsageMonitor(onChange: (state: UsageState) => void): UsageMonitor {
  let state: UsageState = { snapshot: null, errorMessage: null, isRefreshing: false }
  let lastAttemptAt = 0
  let pendingRefresh: Promise<void> | null = null

  function update(next: Partial<UsageState>): void {
    state = { ...state, ...next }
    onChange(state)
  }

  async function runRefresh(): Promise<void> {
    lastAttemptAt = Date.now()
    update({ isRefreshing: true })
    try {
      const snapshot = await fetchUsage(await readAccessToken())
      update({ snapshot, errorMessage: null, isRefreshing: false })
    } catch (error) {
      const message = error instanceof UsageUnavailableError ? error.message : 'Erreur inattendue.'
      update({ errorMessage: message, isRefreshing: false })
    }
  }

  function refresh(): Promise<void> {
    pendingRefresh ??= runRefresh().finally(() => {
      pendingRefresh = null
    })
    return pendingRefresh
  }

  return {
    start: () => {
      void refresh()
      setInterval(() => void refresh(), pollIntervalMs)
    },
    refresh,
    refreshIfStale: () => (Date.now() - lastAttemptAt > staleAfterMs ? refresh() : Promise.resolve()),
    getState: () => state
  }
}
