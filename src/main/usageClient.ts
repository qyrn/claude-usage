import type { ExtraSpend, UsageLimit, UsageSnapshot } from '../shared/usage'
import { isRecord } from './isRecord'
import { UsageUnavailableError } from './usageUnavailableError'

const usageEndpoint = 'https://api.anthropic.com/api/oauth/usage'
const requestTimeoutMs = 10_000

function modelNameOf(scope: unknown): string | null {
  if (!isRecord(scope) || !isRecord(scope.model)) return null
  return typeof scope.model.display_name === 'string' ? scope.model.display_name : null
}

function labelFor(kind: string, scope: unknown): string {
  if (kind === 'session') return 'Session (5 h)'
  if (kind === 'weekly_all') return 'Semaine, tous modèles'
  const modelName = modelNameOf(scope)
  if (kind === 'weekly_scoped' && modelName) return `Semaine, ${modelName}`
  return kind
}

function parseLimit(raw: unknown): UsageLimit | null {
  if (!isRecord(raw) || typeof raw.kind !== 'string' || typeof raw.percent !== 'number') return null
  return {
    kind: raw.kind,
    label: labelFor(raw.kind, raw.scope),
    percent: raw.percent,
    resetsAt: typeof raw.resets_at === 'string' ? raw.resets_at : null
  }
}

function parseExtraSpend(raw: unknown): ExtraSpend | null {
  if (!isRecord(raw) || raw.enabled !== true || !isRecord(raw.used)) return null
  const { amount_minor: amountMinor, currency, exponent } = raw.used
  if (typeof amountMinor !== 'number' || typeof currency !== 'string' || typeof exponent !== 'number') {
    return null
  }
  return { amount: amountMinor / 10 ** exponent, currency }
}

function errorForStatus(status: number): UsageUnavailableError {
  if (status === 401 || status === 403) {
    return new UsageUnavailableError('Token refusé. Lance Claude Code une fois pour le rafraîchir.', 'auth')
  }
  if (status === 429) {
    return new UsageUnavailableError('Chiffres non rafraîchis, le serveur limite les requêtes.', 'rateLimit')
  }
  return new UsageUnavailableError(`Le serveur a répondu ${status}.`, 'unexpected')
}

async function requestUsage(accessToken: string): Promise<Response> {
  try {
    return await fetch(usageEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}`, 'anthropic-beta': 'oauth-2025-04-20' },
      signal: AbortSignal.timeout(requestTimeoutMs)
    })
  } catch {
    throw new UsageUnavailableError('Serveur injoignable. Vérifie ta connexion.', 'network')
  }
}

export async function fetchUsage(accessToken: string): Promise<UsageSnapshot> {
  const response = await requestUsage(accessToken)
  if (!response.ok) throw errorForStatus(response.status)
  const body: unknown = await response.json().catch(() => null)
  if (!isRecord(body) || !Array.isArray(body.limits)) {
    throw new UsageUnavailableError('Réponse inattendue du serveur.', 'unexpected')
  }
  return {
    limits: body.limits.map(parseLimit).filter((limit): limit is UsageLimit => limit !== null),
    extraSpend: parseExtraSpend(body.spend),
    fetchedAt: new Date().toISOString()
  }
}
