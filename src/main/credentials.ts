import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { isRecord } from './isRecord'
import { UsageUnavailableError } from './usageUnavailableError'

const credentialsPath = join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), '.credentials.json')

async function readCredentialsFile(): Promise<unknown> {
  try {
    return JSON.parse(await readFile(credentialsPath, 'utf8'))
  } catch {
    throw new UsageUnavailableError(
      'Identifiants Claude Code introuvables. Connecte-toi avec claude puis /login.'
    )
  }
}

export async function readAccessToken(): Promise<string> {
  const credentials = await readCredentialsFile()
  const oauth = isRecord(credentials) ? credentials.claudeAiOauth : null
  if (!isRecord(oauth) || typeof oauth.accessToken !== 'string') {
    throw new UsageUnavailableError('Pas de connexion Claude (abonnement) dans Claude Code.')
  }
  if (typeof oauth.expiresAt === 'number' && oauth.expiresAt <= Date.now()) {
    throw new UsageUnavailableError('Token expiré. Lance Claude Code une fois pour le rafraîchir.')
  }
  return oauth.accessToken
}
