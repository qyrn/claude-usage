import { app } from 'electron'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const initializedMarkerPath = (): string => join(app.getPath('userData'), 'autostart-initialized')

export function isAutoStartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

export function setAutoStart(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled })
}

export function enableAutoStartOnFirstRun(): void {
  if (!app.isPackaged || existsSync(initializedMarkerPath())) return
  setAutoStart(true)
  writeFileSync(initializedMarkerPath(), '')
}
